# [2013-11-05] Setting up a Raspberry Pi web server using Node & Express

What you'll need:

- At the start
  - USB Keyboard
  - Monitor
  - Ethernet connection
  - HDMI Cable or Video Composite Cable
- Always:
  -   Raspberry Pi
  -   Power Source
  -   4GB SD Card
  -   GitHub Account
- Optional:
  -   A computer for SSH access, and formatting the SD card (OSX assumed for this tutorial)
  -   USB WiFi Dongle (or not if you stick with Ethernet)


### Installing Raspian

The first thing that you're going to need to get going on your Pi is an operating system, and for this walkthrough I'm using Raspian, a popular Raspberry Pi specific flavour of Debian. To start, you'll need to [download the latest .zip version of Raspian](http://www.raspberrypi.org/downloads). Once you have the file, you'll want to unzip it, revealing the OS image.

Now we need to write the file to the SD card, but before you do, enter the following command into a terminal window.

```
df -h
```

You should see something like the following for output:

```
Filesystem      Size   Used  Avail  Capacity  Mounted on
/dev/disk0s2   465Gi  117Gi  348Gi    26%     /
devfs          193Ki  193Ki    0Bi   100%     /dev
map -hosts       0Bi    0Bi    0Bi   100%     /net
map auto_home    0Bi    0Bi    0Bi   100%     /home
```

At this point you're going to need your SD card. Insert the card into the SD slot and enter `df -h` into the console again.

This time you will see something more along the lines of

```
Filesystem      Size   Used  Avail  Capacity  Mounted on
/dev/disk0s2   465Gi  117Gi  348Gi    26%     /
devfs          193Ki  193Ki    0Bi   100%     /dev
map -hosts       0Bi    0Bi    0Bi   100%     /net
map auto_home    0Bi    0Bi    0Bi   100%     /home
/dev/disk1s1    15Gi  1.1Mi   15Gi     1%     /Volumes/SD
```

The mount `/Volumes/SD` is our target, you'll want to unmount it using the terminal command `diskutil unmount /dev/disk1s1`.



To copy the new image of Raspian to your SD card enter the following command. It contains the path to your SD, however, the `s1` is dropped off, and an `r` is appended to the front, producing `rdisk1`.

__Be _very_ careful when doing this, as if you write to the wrong disk, you could end up copying the image to your computer's hard drive.__
```
sudo dd if=2013-09-25-wheezy-raspbian.img of=/dev/rdisk1 bs=1m
```

This command will run silently for some time, and will then give you a little bit of output based on it's success or failure. This may take a while so be patient.

With the disk re-imaged, you are now free to eject the SD card using `diskutil eject /dev/rdisk1`. Once you do, go ahead and plug it into your Raspberry Pi. You'll also want to plug your keyboard into the Pi at this time. Once you have both inserted securely, go ahead and plug the power source into your Raspberry Pi. You should see a typical Linux boot screen, and will have the option to make any configurations to your Pi that you might want to make. When the Pi is finally done booting, you'll be prompted with:

```
rasberrypi login:
```

To get past this screen use the user `pi` with the password: `raspberry`.

### Setting up SSH
[source](http://cplus.about.com/od/raspberrypi/a/How-Do-I-Setup-Ssh-On-Raspberry-Pi.htm)

And we're in. But we don't want to be working on a keyboard plugged directly into the device the whole time, so we're going to enable SSH on the Pi. First, we need to make sure that we have the necessary libraries by running `sudo apt-get install ssh`.

```
sudo /etc/init.d/ssh start
```

To have this happen automatically on bootup, use:

```
sudo update-rc.d ssh defaults
```
Then check to see that it worked using:
```
sudo reboot
```

This is especially nice when you don't want to pull out a keyboard every time you fire up the Pi. It will auto start it's SSH listener, and you can tunnel in without needing a keyboard or monitor on the device. To shut down the Pi in general, use `sudo shutdown -h now`. You can swap out the option `-h` with `-r` and it will perform the same action as `sudo reboot`.

Then we'll want to check your ip address. To do this, in the shell enter `/sbin/ifconfig`. The resulting inet addr for eth0 represents your IP address. Once we have the IP address, we can attempt to SSH into the Pi. To do this on in OSX, simply use `ssh pi@1.1.1.1` with `1.1.1.1` replaced by your IP address. When prompted for your password, enter `raspberry`, and you're in.


### Setting up WiFi
[source](http://learn.adafruit.com/adafruits-raspberry-pi-lesson-3-network-setup/setting-up-wifi-with-occidentalis)

Now we want to set up our WiFi dongle with the device so that we don't have to plug it in via ethernet every time we want to use it. To scan for wifi networks, run `iwlist scan`. Once you locate the network you want,open up your interfaces config by using `sudo nano /etc/network/interfaces`. Edit the file to look like the following:

```
auto lo

iface lo inet loopback
iface eth0 inet dhcp

allow-hotplug wlan0
auto wlan0


iface wlan0 inet dhcp
        wpa-ssid "NETWORK_NAME"
        wpa-psk "NETWORK_PASSWORD"
```

### Installing NodeJS
[source](http://oskarhane.com/raspberry-pi-install-node-js-and-npm/)

First of all we need to create a place in the file system for Node to live, we'll do that using `sudo mkdir /opt/node`. Once it's created, we can fetch version of Node that we want to run in our system with `wget http://nodejs.org/dist/v0.10.4/node-v0.10.8-linux-arm-pi.tar.gz`. Unzip the file using `tar xvzf node-v0.10.8-linux-arm-pi.tar.gz`. Move all the files that have been unzipped to the new home we created for them with `sudo cp -r node-v0.10.8-linux-arm-pi/* /opt/node`. Head back to the root directory (`cd ~`) and edit your bash profile with `nano .bash_profile`. Add the following.

```
PATH=$PATH:/opt/node/bin
export PATH
```

Then run `source .bash_profile`. To ensure that everything installed properly, we can use `node -v` and `npm -v` and get the version numbers for Node and the package manager. Now feel free to remove the tarball and uncompressed files we used earlier from your SD card.

### Setting up your Pi with Github
[source](https://help.github.com/articles/generating-ssh-keys#platform-linux)

Now we've got Node, and we're going to want to be able to pull in projects to run on top of it. To do this, we're going to register our Pi device with the GitHub account we want to pull from. First, we need to generate an SSH key. To do this, run `ssh-keygen -t rsa -C "YOUR_EMAIL@EXAMPLE.COM"`. You will then be prompted for a file name, just hit enter. You will then be asked to give your ssh key a password. Enter your password twice, and your key will be generated. The contents of the key will be stored at `~/.ssh/id_rsa.pub`. Open the file and copy the contents to your clipboard, then add it to your GitHub account through the GitHub web interface using _Account Settings > SSH Keys > Add SSH Key_. Once you have add your key, you should be able to clone any of your git repositories. For example, enter the directory you would like to clone the project into and use `git@github.com:neildahlke/pi-sockets.git` to clone the `pi-sockets` example we will be using below. With the project cloned, go ahead and run `node app.js` in the new project directory, then visit the URL you specified earlier on port 8888.

Your Raspberry Pi is now an active web server.


### Backing up your Pi
[source](http://raspberrypi.stackexchange.com/questions/311/how-do-i-backup-my-raspberry-pi)

There is nothing worse than completing all of these steps, then having power supply issues corrupt your SD card. To avoid the long hassle of setting up your Pi again, it is recommended that you back up your SD card at this point. To do that, take the SD card with the properly set up image, and server code, and plug it into your Mac. Once it's in, run the following:

```
dd if=/dev/rdiskx of=/path/to/image bs=1m
```

Where `/dev/rdiskx` is your SD card and the `x` is the number corresponding to your SD.