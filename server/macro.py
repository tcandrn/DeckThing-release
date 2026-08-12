import sys
import json
import keyboard
import time
import traceback

def main():
    for line in sys.stdin:
        try:
            data = json.loads(line)
            command = data.get("command")
            payload = data.get("payload")

            if command == "type":
                keyboard.write(payload)
            elif command == "hotkey":
                modifiers = payload.get("modifiers", [])
                key = payload.get("key", "")
                if modifiers and key:
                    keyboard.send("+".join(modifiers) + "+" + key)
                elif key:
                    keyboard.send(key)
            elif command == "game":
                keyboard.send(payload)
            elif command == "script":
                script_lines = payload.split('\n')
                for script_line in script_lines:
                    script_line = script_line.strip()
                    if not script_line:
                        continue
                    parts = script_line.split(' ', 1)
                    cmd = parts[0].upper()
                    val = parts[1] if len(parts) > 1 else ""
                    if cmd == "TYPE":
                        keyboard.write(val)
                    elif cmd == "PRESS":
                        keyboard.send(val.lower())
                    elif cmd == "WAIT":
                        try:
                            ms = int(val)
                            time.sleep(ms / 1000.0)
                        except:
                            pass
                    elif cmd == "REM":
                        pass

            sys.stdout.flush()

        except Exception as exc:
            print(f"Macro engine error: {exc}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()