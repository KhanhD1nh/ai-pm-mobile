import argparse
import asyncio
import json

from pymobiledevice3.services.accessibilityaudit import AccessibilityAudit
from pymobiledevice3.tunneld.api import get_tunneld_device_by_udid

UDID = "00008140-0016211A267B001C"
TUNNELD = ("127.0.0.1", 49151)


async def with_audit():
    rsd = await get_tunneld_device_by_udid(UDID, TUNNELD, bridge=True)
    if rsd is None:
        raise RuntimeError("iPhone tunnel not found")
    return rsd, AccessibilityAudit(rsd)


async def list_items():
    rsd, audit = await with_audit()
    try:
        items = []
        async with audit:
            async for item in audit.iter_elements():
                items.append(item.to_dict())
        print(json.dumps(items, ensure_ascii=False, indent=2))
    finally:
        await rsd.close()


async def press(caption: str):
    rsd, audit = await with_audit()
    try:
        target = None
        async with audit:
            async for item in audit.iter_elements():
                if (item.caption or "").strip() == caption:
                    target = item
                    break
            if target is None:
                raise RuntimeError(f"Accessibility element not found: {caption}")
            await audit.perform_press(bytes.fromhex(target.platform_identifier))
            print(json.dumps(target.to_dict(), ensure_ascii=False))
    finally:
        await rsd.close()


async def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list")
    p = sub.add_parser("press")
    p.add_argument("caption")
    args = parser.parse_args()

    if args.command == "list":
        await list_items()
    else:
        await press(args.caption)


if __name__ == "__main__":
    asyncio.run(main())
