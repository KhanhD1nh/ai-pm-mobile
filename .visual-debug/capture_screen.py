import asyncio
from pathlib import Path

from pymobiledevice3.lockdown import create_using_usbmux
from pymobiledevice3.services.screenshot import ScreenshotService

UDID = "00008140-0016211A267B001C"


async def main() -> None:
    output = Path(__file__).with_name("current.png")
    lockdown = await create_using_usbmux(serial=UDID, connection_type="USB")
    screenshot = ScreenshotService(lockdown)
    data = await screenshot.take_screenshot()
    output.write_bytes(data)
    print(output)


if __name__ == "__main__":
    asyncio.run(main())
