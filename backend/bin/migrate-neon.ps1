$ErrorActionPreference = 'Stop'
$previousUrl = $env:DATABASE_URL
$secret = Read-Host 'Cole a URL de conexão direta do banco Neon (entrada oculta)' -AsSecureString
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $connection = [System.Net.NetworkCredential]::new('', $secret).Password.Trim()
    $target = $null
    if (-not [Uri]::TryCreate($connection, [UriKind]::Absolute, [ref]$target) -or
        $target.Scheme -notin @('postgres', 'postgresql') -or
        -not $target.Host.EndsWith('.neon.tech') -or $target.AbsolutePath.Length -le 1 -or
        $target.Query -notmatch '(?:^\?|&)sslmode=(?:require|verify-ca|verify-full)(?:&|$)') {
        throw 'Use a URL PostgreSQL do painel Neon com o nome do banco e sslmode=require ou verify-full.'
    }
    if ($target.Host.Split('.')[0].EndsWith('-pooler')) {
        throw 'No painel Connect do Neon, desative Connection pooling e copie a URL direta.'
    }
    $env:DATABASE_URL = $connection
    Write-Host "Destino: $($target.Host) / $($target.AbsolutePath.TrimStart('/'))"
    & php bin/console doctrine:migrations:migrate --all-or-nothing
    if ($LASTEXITCODE -ne 0) { throw 'A migration não foi concluída.' }
    & php bin/console doctrine:migrations:up-to-date
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível confirmar o estado final das migrations.' }
} finally {
    $env:DATABASE_URL = $previousUrl
    $secret.Dispose()
    Pop-Location
}
