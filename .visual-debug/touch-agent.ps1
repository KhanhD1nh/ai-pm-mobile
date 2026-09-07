$py='C:\Users\KhanhDinhWork\AppData\Local\Programs\Python\Python311\python.exe'
$queue='E:\WorkSpace\AI-PM\ai-pm-mobile\.visual-debug\touch-agent.cmd'
$ack='E:\WorkSpace\AI-PM\ai-pm-mobile\.visual-debug\touch-agent.ack'
$last=''
while ($true) {
  if (Test-Path $queue) {
    $line=(Get-Content $queue -Raw).Trim()
    if ($line -and $line -ne $last) {
      $parts=$line.Split('|')
      $seq=$parts[0]
      try {
        if ($parts[1] -eq 'tap') {
          $px=[double]$parts[2]; $pyy=[double]$parts[3]
          $x=[int](65535*$px/440.0); $y=[int](65535*$pyy/956.0)
          & $py -m pymobiledevice3 developer core-device universal-hid-service tap $x $y --rsd 'fd09:f757:1c20::1' 58312 | Out-Null
        }
        Set-Content $ack "$seq|ok" -Encoding ASCII
      } catch { Set-Content $ack "$seq|error|$($_.Exception.Message)" -Encoding ASCII }
      $last=$line
    }
  }
  Start-Sleep -Milliseconds 120
}
