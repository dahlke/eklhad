# [2013-11-23] Setting up Sublime Text 3 from the Command Line

To make Sublime Text available via the command line argument `subl` use:

```bash
sudo ln -s "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/bin/subl
```

Then to use your editor as the default for git commits and such, enter:

```bash
git config --global core.editor "sub --wait"
```
