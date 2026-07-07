# Funciones compartidas por los scripts de medición ISO/IEC 25023.
# Compatible con Windows PowerShell 5.1 (sin operadores ternarios ni &&).

$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

# Ejecuta una petición HTTP y SIEMPRE devuelve un resultado (aunque sea 4xx/5xx),
# con el estado, el cuerpo y la latencia en milisegundos.
function Invoke-Medicion {
    param(
        [string]$Metodo,
        [string]$Url,
        [hashtable]$Cabeceras = $null,
        [object]$Cuerpo = $null,   # object: un [string] convertiria $null en '' y los GET enviarian cuerpo
        [string]$ContentType = 'application/json',
        [int]$TimeoutSec = 20
    )
    $inicio = Get-Date
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $params = @{ Method = $Metodo; Uri = $Url; UseBasicParsing = $true; TimeoutSec = $TimeoutSec }
        if ($null -ne $Cabeceras -and $Cabeceras.Count -gt 0) { $params.Headers = $Cabeceras }
        if ($null -ne $Cuerpo) { $params.Body = $Cuerpo; $params.ContentType = $ContentType }
        $r = Invoke-WebRequest @params
        $sw.Stop()
        # Content-types no reconocidos como texto (p. ej. application/vnd.spring-boot.actuator.v3+json)
        # llegan como byte[]: decodificar a texto UTF-8.
        $contenido = $r.Content
        if ($contenido -is [byte[]]) { $contenido = [System.Text.Encoding]::UTF8.GetString($contenido) }
        return @{
            Estado = [int]$r.StatusCode; Cuerpo = [string]$contenido
            CabecerasResp = $r.Headers; LatenciaMs = $sw.ElapsedMilliseconds
            Inicio = $inicio; Error = $null
        }
    } catch [System.Net.WebException] {
        $sw.Stop()
        $resp = $_.Exception.Response
        if ($null -ne $resp) {
            $contenido = ''
            try {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $contenido = $reader.ReadToEnd()
                $reader.Close()
            } catch {}
            return @{
                Estado = [int]$resp.StatusCode; Cuerpo = $contenido
                CabecerasResp = $null; LatenciaMs = $sw.ElapsedMilliseconds
                Inicio = $inicio; Error = $null
            }
        }
        # Sin respuesta: caída de conexión, timeout, DNS...
        return @{
            Estado = 0; Cuerpo = ''; CabecerasResp = $null
            LatenciaMs = $sw.ElapsedMilliseconds; Inicio = $inicio
            Error = $_.Exception.Message
        }
    } catch {
        $sw.Stop()
        return @{
            Estado = 0; Cuerpo = ''; CabecerasResp = $null
            LatenciaMs = $sw.ElapsedMilliseconds; Inicio = $inicio
            Error = $_.Exception.Message
        }
    }
}

# ¿El texto es JSON válido?
function Test-EsJson {
    param([string]$Texto)
    if ([string]::IsNullOrWhiteSpace($Texto)) { return $false }
    try { $null = $Texto | ConvertFrom-Json; return $true } catch { return $false }
}

# Inicia sesión como admin y devuelve el accessToken (o $null si falla).
function Get-TokenAdmin {
    param([string]$BaseUrl, [string]$Email, [string]$Password)
    $cuerpo = (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress)
    $r = Invoke-Medicion -Metodo 'POST' -Url "$BaseUrl/v1/auth/login" -Cuerpo $cuerpo
    if ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo)) {
        $json = $r.Cuerpo | ConvertFrom-Json
        if ($null -ne $json.data -and $null -ne $json.data.accessToken) {
            return [string]$json.data.accessToken
        }
    }
    return $null
}

# Devuelve la carpeta resultados/ del paquete (la crea si no existe).
function Get-CarpetaResultados {
    $carpeta = Join-Path (Split-Path -Parent $PSScriptRoot) 'resultados'
    if (-not (Test-Path $carpeta)) { New-Item -ItemType Directory -Path $carpeta | Out-Null }
    return $carpeta
}

# Exporta filas a CSV en UTF-8 e informa por consola.
function Export-Resultado {
    param([object[]]$Filas, [string]$Ruta)
    $Filas | Export-Csv -Path $Ruta -NoTypeInformation -Encoding UTF8
    Write-Host ("  -> " + $Ruta) -ForegroundColor DarkGray
}
