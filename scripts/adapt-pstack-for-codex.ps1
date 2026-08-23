param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$SourceRef = 'fd6dd6f7276956a532bb78a748a8d2818b6eb5f4'
)

$ErrorActionPreference = 'Stop'

$skillRoot = Join-Path $ProjectRoot '.agents\skills'
$lockPath = Join-Path $ProjectRoot 'skills-lock.json'
$unsupportedKeys = @(
    'disable-model-invocation',
    'mode',
    'icon',
    'color',
    'reminder'
)

$priorLock = $null
if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    try {
        $priorLock = [System.IO.File]::ReadAllText($lockPath) | ConvertFrom-Json
    }
    catch {
        throw "Cannot read the existing PStack lock file: $lockPath"
    }
}

if (-not (Test-Path -LiteralPath $skillRoot -PathType Container)) {
    throw "PStack skill root does not exist: $skillRoot"
}

function Get-FolderHash {
    param([string]$Path)

    $stream = [System.IO.MemoryStream]::new()
    try {
        Get-ChildItem -LiteralPath $Path -File -Recurse |
            Sort-Object FullName |
            ForEach-Object {
                $relativePath = [System.IO.Path]::GetRelativePath($Path, $_.FullName).Replace('\', '/')
                $pathBytes = [System.Text.Encoding]::UTF8.GetBytes($relativePath)
                $stream.Write($pathBytes, 0, $pathBytes.Length)
                $stream.WriteByte(0)

                $fileBytes = [System.IO.File]::ReadAllBytes($_.FullName)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
                $stream.WriteByte(0)
            }

        $stream.Position = 0
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try {
            return [Convert]::ToHexString($hasher.ComputeHash($stream)).ToLowerInvariant()
        }
        finally {
            $hasher.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

$adaptedSkills = 0
$metadataChanged = 0
$lockSkills = [ordered]@{}
$skillDirectories = @(Get-ChildItem -LiteralPath $skillRoot -Directory | Sort-Object Name)

foreach ($skillDirectory in $skillDirectories) {
    $skillFile = Join-Path $skillDirectory.FullName 'SKILL.md'
    if (-not (Test-Path -LiteralPath $skillFile -PathType Leaf)) {
        throw "Missing SKILL.md: $($skillDirectory.FullName)"
    }

    $raw = [System.IO.File]::ReadAllText($skillFile)
    $match = [regex]::Match($raw, '\A---\r?\n(?<frontmatter>.*?)\r?\n---(?<body>[\s\S]*)\z', 'Singleline')
    if (-not $match.Success) {
        throw "Invalid frontmatter boundary: $skillFile"
    }

    $frontmatterLines = @($match.Groups['frontmatter'].Value -split '\r?\n')
    $policyMarker = $frontmatterLines |
        Where-Object { $_ -match '^\s*disable-model-invocation:\s*(true|false)\s*$' } |
        Select-Object -First 1

    $agentDirectory = Join-Path $skillDirectory.FullName 'agents'
    $openAiMetadata = Join-Path $agentDirectory 'openai.yaml'
    $priorSkill = $null
    if ($null -ne $priorLock -and $null -ne $priorLock.skills) {
        $priorSkillProperty = $priorLock.skills.PSObject.Properties[$skillDirectory.Name]
        if ($null -ne $priorSkillProperty) {
            $priorSkill = $priorSkillProperty.Value
        }
    }

    $allowImplicitInvocation = $true
    if ($null -ne $policyMarker) {
        $allowImplicitInvocation = -not ($policyMarker -match ':\s*true\s*$')
    }
    elseif ($null -ne $priorSkill -and $priorSkill.ref -eq $SourceRef) {
        $priorPolicyProperty = $priorSkill.PSObject.Properties['allowImplicitInvocation']
        if ($null -ne $priorPolicyProperty) {
            $allowImplicitInvocation = [bool]$priorPolicyProperty.Value
        }
        elseif (Test-Path -LiteralPath $openAiMetadata -PathType Leaf) {
            $metadataText = [System.IO.File]::ReadAllText($openAiMetadata)
            $allowImplicitInvocation = -not ($metadataText -match '(?m)^\s*allow_implicit_invocation:\s*false\s*$')
        }
    }
    $filteredLines = @(
        $frontmatterLines | Where-Object {
            $line = $_
            -not ($unsupportedKeys | Where-Object { $line -match "^\s*$([regex]::Escape($_))\s*:" })
        }
    )

    if ($skillDirectory.Name -eq 'poteto-mode') {
        $filteredLines = @($filteredLines | ForEach-Object {
            if ($_ -match '^\s*name:\s*Poteto Mode\s*$') { 'name: poteto-mode' } else { $_ }
        })
    }

    $adapted = "---`n$($filteredLines -join "`n")`n---$($match.Groups['body'].Value)"
    if ($adapted -cne $raw) {
        [System.IO.File]::WriteAllText($skillFile, $adapted, [System.Text.UTF8Encoding]::new($false))
        $adaptedSkills++
    }

    $genericMetadata = @'
policy:
  allow_implicit_invocation: false
'@
    $potetoMetadata = @'
interface:
  display_name: "Poteto Mode"
  short_description: "Poteto's concise, rigorous working style"
  default_prompt: "Use $poteto-mode to run this task with deliberate delegation, plain prose, and direct verification."
policy:
  allow_implicit_invocation: false
'@

    $expectedMetadata = if ($skillDirectory.Name -eq 'poteto-mode') {
        $potetoMetadata.TrimStart() + "`n"
    }
    else {
        $genericMetadata.TrimStart() + "`n"
    }

    if (-not $allowImplicitInvocation) {
        [System.IO.Directory]::CreateDirectory($agentDirectory) | Out-Null
        $currentMetadata = if (Test-Path -LiteralPath $openAiMetadata -PathType Leaf) {
            [System.IO.File]::ReadAllText($openAiMetadata)
        }
        else {
            $null
        }

        if ($currentMetadata -cne $expectedMetadata) {
            [System.IO.File]::WriteAllText($openAiMetadata, $expectedMetadata, [System.Text.UTF8Encoding]::new($false))
            $metadataChanged++
        }
    }
    elseif (Test-Path -LiteralPath $openAiMetadata -PathType Leaf) {
        $currentMetadata = [System.IO.File]::ReadAllText($openAiMetadata)
        $knownGeneratedMetadata = @(
            $genericMetadata.TrimStart() + "`n",
            $potetoMetadata.TrimStart() + "`n"
        )
        if ($knownGeneratedMetadata -ccontains $currentMetadata) {
            Remove-Item -LiteralPath $openAiMetadata
            if ((Get-ChildItem -LiteralPath $agentDirectory -Force | Measure-Object).Count -eq 0) {
                Remove-Item -LiteralPath $agentDirectory
            }
            $metadataChanged++
        }
    }

    $lockSkills[$skillDirectory.Name] = [ordered]@{
        source = 'cursor/plugins'
        sourceType = 'github'
        sourceUrl = 'https://github.com/cursor/plugins.git'
        ref = $SourceRef
        skillPath = "pstack/skills/$($skillDirectory.Name)/SKILL.md"
        allowImplicitInvocation = $allowImplicitInvocation
        computedHash = Get-FolderHash -Path $skillDirectory.FullName
    }
}

$lock = [ordered]@{
    version = 1
    skills = $lockSkills
}

$lockJson = $lock | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($lockPath, $lockJson + "`n", [System.Text.UTF8Encoding]::new($false))

[PSCustomObject]@{
    SkillCount = $skillDirectories.Count
    AdaptedSkills = $adaptedSkills
    MetadataChanged = $metadataChanged
    LockEntries = $lockSkills.Count
}
