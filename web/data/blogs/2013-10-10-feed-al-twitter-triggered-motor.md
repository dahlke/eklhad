# [2013-10-10] FeedAl: Twitter Triggered Motor with Johnny-Five, Arduino and Raspberry Pi

_This article expands on my previous topic [Setting up a Raspberry Pi web server using Node & Express](http://blog.dahlke.us/setting-up-a-raspberry-pi-web-server-using-node-express/) and it assumes that you have your Raspberry Pi set up in that fashion, or a fashion similar to it._

- (1) Arduino Uno Board
- (1) Raspberry Pi (Model B)
- (1) Red LED
- (1) Diode
- (1) MOFSET Transistor
- (1) 10 Kilo-Ohm resistor
- (1) 220 Ohm resistor
- Jumper wires

If you already have completed the process of setting up your Raspberry Pi as a web server, then actually getting your Arduino to communicate with the outside world is quite easy.

## Setting Up the Circuit

First and foremost, we need to build the circuit. Below I've included a drawing of my circuit, feel free to modify or expand it in any way you'd like. Mine is simple, I draw power for the motor from a 9V battery so as not stress the Arduino board. I included a simple push button as well, that allows you to trigger the motor at any time and ensure that the circuit is still operating correctly. This is especially helpful when you're trying to debug if an issue is in the circuit or in your code.

{<1>}![Tweeter Feeder Arduino Circuit](/content/images/2013/Oct/Screen_Shot_2013_10_20_at_1_03_50_PM.png)

Once you've built your circuit, you should test it by pushing the button and seeing if your motor spins. If it does, we're in business.

## Setting Up Johnny Five

Before your Arduino is ready to start communication with the Raspberry Pi, we want to set it up for usage with [Johnny-Five](https://github.com/rwaldron/johnny-five), a Firmata based JavaScript Arduino framework. We'll follow the steps listed on the GitHub page for getting up and running on the Arduino. These steps are:

- Plug your Arduino or Arduino compatible microcontroller into your computer via USB
- Open up the Arduino IDE
- Select: File > Examples > Firmata > StandardFirmata
- Click the "Upload" button

If the upload was successful, the board is now prepared and you can close the Arduino IDE. Now your Arduino is ready to start running some Johnny-Five code. You do not have to complete this next step now, as we're going to have you install Johnny-Five again on your Raspberry Pi. To install Johnny-Five, we'll use NPM:

```bash
# If you don't have socket.io installed already,
# you may need to install it.
npm install socket.io

# Then we can go ahead and install Johnny-Five
npm install johnny-five
```

However, you may be nervous about leaving the Arduino IDE behind. Don't be, we'll be running our apps like we run our normal Node.js apps now, using the `node` terminal command. But I you may want to see for yourself, and there is a very simple example [here](http://jsfiddle.net/rwaldron/dtudh/show/light/). Create a new file `app.js`, copy the source, and when you're ready, run `node app.js` on your new file. You may not want to do this if you just spent a good chunk of time setting up your circuit. If that's the case, you can go ahead an unplug your Arduino from your computer now.

### Accessing the Twitter API

Awesome.

Now we're running JavaScript on our Arduino. It's time to head on over to [Twitter's dev site](https://dev.twitter.com/) and create yourself an account. Once you have one, visit your applications.

{<2>}![Finding My Applications](/content/images/2013/Oct/Screen_Shot_2013_10_20_at_1_39_46_PM.png)

Select the application that you would like to be using, in my case, that application is called "Feed Albert". You may have to create an application to do this first, go ahead and do that.

{<3>}![Selecting an Application](/content/images/2013/Oct/Screen_Shot_2013_10_20_at_1_39_57_PM.png)

With your application selected, you should see a group of tabs at the top of the page. We want to keep the Details tab open.

{<4>}![What You'll See](/content/images/2013/Oct/Screen_Shot_2013_10_20_at_1_40_11_PM.png)

Scroll down the page to find the __consumer key__, __consumer secret__, __access key__, and __access secret__. We need all of these in order for our application to work, so either write these down, or leave this information open in a tab for the time being.
{<5>}![Where the API Access Is](/content/images/2013/Oct/Screen_Shot_2013_10_20_at_1_40_15_PM.png)

## Connecting to the Raspberry Pi

Now that we have a working circuit, and our Twitter API access codes, we can begin work on the Raspberry Pi.

### Via SSH

This portion is where I really encourage you to read my previous article [Setting up a Raspberry Pi web server using Node & Express](http://blog.dahlke.us/setting-up-a-raspberry-pi-web-server-using-node-express/). It walks you through the steps of setting up your Pi for SSH access either wirelessly (if you have a WiFi dongle for your Raspberry Pi) or on a wired connection. This allows you to develop on your Pi from your normal workstation.

If you know how to do this, or have already set up your Pi for SSH, you can skip the article.

Plug your Raspberry Pi into it's power source and wait a few seconds (about 20) while it boots up. Once it's booted, you should be able to SSH into the machine using `pi@XXX.XXX.XXX.XXX` where you replace the `XXX`s with your IP address. Once you're logged into the box, lets set up where we're going to build our project.

### Via Keyboard and Monitor

With the keyboard and monitor attached, you can just login as normal and begin developing your project.

## Starting our Project

Now that we're on our Raspberry Pi, we're ready to develop our project.

```bash
# Create a directory for us to work in...
mkdir twitter-trigger

# Enter the new directory you created...
cd twitter-trigger

# And create a file that we will write our code in..
neildahlke$ touch app.js

# Install
neildahlke$ npm install util && npm install socket-io && npm install johnny-five && npm install twitter-api
```

Once you have your file created, you can open it in your editor of choice. I'll be using `vi` in this tutorial, but feel free to swap that out with `nano`, `emacs`, etc. Open the file.

```bash
vi app.js
```

And copy the following to your file. Follow along with the comments.

```javascript
// Require the libraries we installed
var util = require('util'),
    client = require('twitter-api').createClient();
    j5 = require("johnny-five"),

    // Initialize a Johnny-Five board
    board = new j5.Board(),

    // Set the pins to their corresponding numbers.
    // This assumes you've used the circuit above.
    BTNPIN = 7,
    LEDPIN = 8,
    MOTORPIN = 9,
    ledOn = false;

board.on("ready", function() {

  // Create Johnny-Five instances
  // of all the components we'll be using.
  var led = new j5.Led(LEDPIN),
      motor = new j5.Motor(MOTORPIN),
      btn = new j5.Button(BTNPIN);

  // Bind the motor on start, and set the time
  // the motor will spin.
  motor.on("start", function(err, timestamp) {
    board.wait(2000, function() {
      motor.stop();
    });
  });

  // Bind on the motor stop, log the time.
  motor.on("stop", function( err, timestamp ) {
    console.log("stop", timestamp);
  });

  // Remember those keys we wrote down earlier?
  // This is where you'll need those.
  client.setAuth (
    'CONSUMER_KEY',
    'CONSUMER_SECRET',
    'ACCESS_KEY',
    'ACCESS_SECRET'
  );

  // Set a max number of times we'll let this run.
  var num = 0,
      max = 10;

    // From the Twitter client we can stream in
    // statuses, and filter on them as needed.
    // I filter on "#FeedAl", which is the trigger
    // word to start the motor.

    client.stream('statuses/filter', {
      track: '#FeedAl'
    }, function(json) {

      var tweet = JSON.parse( json );

      if (tweet.text && tweet.user) {

        // @FeedAlbert is the only Twitter account that
        // will work with the trigger hashtag.
        if (tweet.user.screen_name === 'FeedAlbert') {
          led.on();
          motor.start();

          setTimeout(function() {
            led.off();
          }, 4000);

          if(++num === max){
            console.log('----');
            client.abort();
          }
        }
      }

    });

  btn.on("hit", function(){
    led.on();
    motor.start();
  });

  btn.on("release", function(){
    led.off();
  });

});
```

Once we have the code written, we're ready to deploy it to the Arduino. Plug the Arduino into your Raspberry Pi via USB. Once you see that the Arduino has completed it's short boot up, you're ready to run your JavaScript. Run:

```bash
node app.js
```

You should see some startup output, and then you're ready to go! Login as the account you want to be able to trigger from (mine is @FeedAlbert) and try your trigger word! Once your tweet has successfully sent you should see your motor hop to life the same way it does when you press the button.

Yay! You're triggering your motor wirelessly using Twitter, a Raspberry Pi, and Arduino!

Feel free to watch the [video example](http://www.youtube.com/watch?v=5iBVpNgbmUA) and grab yourself the [source](https://gist.github.com/neildahlke/7074474). If you have any questions or concerns, please reach out to me at [@neildahlke](http://twitter.com/neildahlke).
