echo "1. Create extension directory if it does not exist: ~/.local/share/gnome-shell/extensions/WH1000XM4ProfileToggle"
mkdir -p ~/.local/share/gnome-shell/extensions/WH1000XM4ProfileToggle

echo "2. Copy extension files to extension directory: ~/.local/share/gnome-shell/extensions/WH1000XM4ProfileToggle"
cp ./* ~/.local/share/gnome-shell/extensions/WH1000XM4ProfileToggle

echo "3. Restart GNOME Shell"
killall -w -SIGQUIT gnome-shell

echo "4. Enable extension WH1000XM4ProfileToggle"
gnome-extensions enable WH1000XM4ProfileToggle

echo "DONE"

