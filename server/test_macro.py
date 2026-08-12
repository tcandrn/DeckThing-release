import unittest
from unittest.mock import patch, MagicMock
import io
import sys
import os

# Add the server directory to python path if needed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import macro

class TestMacroEngine(unittest.TestCase):

    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_type_command(self, mock_stdin, mock_send, mock_write):
        # Mock stdin to supply one type command
        mock_stdin.__iter__.return_value = ['{"command": "type", "payload": "hello world"}']
        
        macro.main()
        
        mock_write.assert_called_once_with("hello world")
        mock_send.assert_not_called()

    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_hotkey_command_simple(self, mock_stdin, mock_send, mock_write):
        # Mock stdin to supply simple hotkey command
        mock_stdin.__iter__.return_value = ['{"command": "hotkey", "payload": {"key": "enter"}}']
        
        macro.main()
        
        mock_send.assert_called_once_with("enter")
        mock_write.assert_not_called()

    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_hotkey_command_modifiers(self, mock_stdin, mock_send, mock_write):
        # Mock stdin to supply hotkey with modifiers
        payload = {"command": "hotkey", "payload": {"key": "c", "modifiers": ["ctrl", "alt"]}}
        import json
        mock_stdin.__iter__.return_value = [json.dumps(payload)]
        
        macro.main()
        
        mock_send.assert_called_once_with("ctrl+alt+c")
        mock_write.assert_not_called()

    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_game_command(self, mock_stdin, mock_send, mock_write):
        mock_stdin.__iter__.return_value = ['{"command": "game", "payload": "f13"}']
        
        macro.main()
        
        mock_send.assert_called_once_with("f13")

    @patch('time.sleep')
    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_script_commands(self, mock_stdin, mock_send, mock_write, mock_sleep):
        script_text = (
            "REM this is a comment\n"
            "TYPE hello\n"
            "WAIT 500\n"
            "PRESS enter\n"
        )
        import json
        payload = {"command": "script", "payload": script_text}
        mock_stdin.__iter__.return_value = [json.dumps(payload)]
        
        macro.main()
        
        # Verify TYPE hello
        mock_write.assert_called_once_with("hello")
        # Verify PRESS enter
        mock_send.assert_called_once_with("enter")
        # Verify WAIT 500
        mock_sleep.assert_called_once_with(0.5)

    @patch('keyboard.write')
    @patch('keyboard.send')
    @patch('sys.stdin')
    def test_exception_handling_continues_loop(self, mock_stdin, mock_send, mock_write):
        # Test that an exception in one JSON line does not stop the next line from processing
        mock_stdin.__iter__.return_value = [
            '{invalid json}',
            '{"command": "type", "payload": "second command"}'
        ]
        
        macro.main()
        
        # Second command should have executed despite the first line being invalid JSON
        mock_write.assert_called_once_with("second command")

if __name__ == '__main__':
    unittest.main()
