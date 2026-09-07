$py='C:\Users\KhanhDinhWork\AppData\Local\Programs\Python\Python311\python.exe'
$args=@('-m','pymobiledevice3','remote','tunneld','--host','127.0.0.1','--port','49151','--usb','--usbmux','--usbmux-address','127.0.0.1:27015','--no-wifi','--no-mobdev2')
Start-Process -FilePath $py -ArgumentList $args -RedirectStandardOutput 'E:\WorkSpace\AI-PM\ai-pm-mobile\.visual-debug\tunneld.out.txt' -RedirectStandardError 'E:\WorkSpace\AI-PM\ai-pm-mobile\.visual-debug\tunneld.err.txt' -Wait
