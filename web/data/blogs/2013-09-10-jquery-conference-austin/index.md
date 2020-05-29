# [2013-09-10] jQuery Conference 2013: Austin

##### 10 Sept 2013

---

## The State of jQuery - Dave Methvin

- Bower and NPM dependency management out next month.
- Finding forced layouts (http://jsfiddle.net/qjncp)
- Full page forced layouts occur every time you ask the browser if we have enough content during an infinite scroll. That's a lot of work on the browser.
- Alternative: Instead of asking the browser every time, determine the height of a row, and track how long we've scrolled. Ex: 200px high, the page scrolled 740px, we need 4 more rows.
- When looking for elements, using class names such as `.hidden` will provide faster selection than `:hidden` as it doesn't need to check style rules or snything else, it only has to inspect the DOM tree. It won't force a layout, works well with styling, and is battery efficient.
- Throttle high frequency events like mousemove or scroll; handle with requestAnimationFrame (http://www.html5rocks.com/en/tutorials/speed/rendering/)
- Moral: Know your tools. Modern browsers have the tools to find these issues. (Even IE... 11)

---

## Digging and Debugging - Brian Arnold

#### Non Technical Tips

- Read Javascript: The Definitive Guide. Not just The Good Parts.
- Verbally express what the problem is, even if you don't expect help from that person. It helps to give you clarity on the problem.

#### Understand the Tools
- Chrome is the most feature rich debugger.
- `$0` is an alias in the Chrome command line to the most recently inspected DOM node. When you select something else, it becomes "$1" and so on.
- `$_` declares a variable for the last command so that we can use it and inspect it's DOM structure easily. This is useful in comparison to `$('label')` which is an invocation, which we cannot use command line autocomplete on.
- `console.group()` - allows you to group multiple log statements so that you can expand and contract them.
- Using `dir($0)` allows you to view any element as more of an object which makes it a bit easier to read.
- `keys(jQuery)` will give you an array of all the keys in the command line.
- `copy($_)` gives you a string based representation of the last object and copies it to your clipboard. You can pass this through `JSON.stringify()` and get a JSON representation of that data.
- Using the debugger gives you great access to the console executing in the proper context.
- You can set _conditional breakpoints_ in Chrome debugger so that you only stop if a given condition is met.
- You can also set breakpoints on the DOM, so for example, you can set it such that you will get a break when any subtree element is modified.
- XHR breakpoints can be set when the URL contains a given string as well.
- Using pretty print can help to make minified source a bit more readable.
- Using profiles, we can record a bit of time on the page, and get a detailed result on processing. This gives you a very clear visual as to where your time is going.


#### Techniques

- Private Mode - no history, cache, cookies.
- Use a style guide. Look into things like [Idiomatic](https://github.com/rwaldron/idiomatic.js/) and [EditorConfig](http://editorconfig.org/).
- `console.count("functionName")` will show you how many times a function is invoked.
- Which code is mine? It's often an `anonymous function` as it is often used as a callback in a library.

#### Resources
- Discover DevTools
- CommandLine API (Chrome)
- Console API (Chrome)
- Command Line API (Firebug)


---

## Getting the Most out of jQuery Widgets - Richard Lindsey

- Think small. Think modular. Elements, cells, compounds, organisms.
- Keep them decoupled. Subscribe and Respond. Communicate through events.
- Observe and mediate. Bundle smaller moduls, provide a public api, direct references only go downward, each layer consumes lower-level events and publishes upwards.
- Make it testable. Does it perform operation or calculation? Is it part of the widget's public facing API?
- Public functions should have unit tests, store prototypes in object namespaces, test logical functions separately.
- *Summary:* _Only make componenets as large as they need to be. Keep them as decoupled as possible. Consume downwards, communicate upwards. Make functions and options granular and robust for potential overrides. Test, test, and test. Make every attempt to ensure backward compatibility._
- Presentation slides can be found at: http://bit.ly/jqwidgets

---

## Using jQuery Mobile to Build Device Agnostic Pages - Asta Gindulyte

- http://pubchem.ncbi.nlm.nih.gov/
- Challenges: screen-size, touch, content organization, and testing.
- Screen size variety challenge - no scroll, and font size big enough to read.
- Touch challenge - buttons big enough to touch, swipe and other gestures should be intuitive.
- Content organization challegne - showing/hiding based on screen size (sometimes people with small screens seem penalized.). Having diffferent layouts from large to small screen may confuse users.
- Device testing challenge - no free lunch, you really need to test on all devices to make sure everything is working as expected. Emulators like [screenfly](http://quirktools.com/screenfly/) can help.
- Why jQuery Mobile? Cross browser, cross device, touch friendly, responsive, layout and theming engine, ajax page navigation and _great documentation_.

---

## Grunt Automates All of the Things ... What's Next? - Aaron Stacy

- Don't just build, *ship*.
- _Releases should not be "tribal knowledge"._ If one of your teammates was going to get hit by a bus, could you still push a release?
- Continuous integration - everything you do when you deploy, except all the time, every commit.
- [TravisCI](https://travis-ci.org/) as an alternative to [Jenkins](http://jenkins-ci.org/)

##### Continuous integration example.
[Source](https://github.com/aaronj1335/shipit)

- make `grunt test` work. ([Selenium](http://docs.seleniumhq.org/) and [PhantomJS](http://phantomjs.org) recommended)
  - `grunt-contib-qunit`
  - grunt plugins for mocha
  - phantom.js
  - saucelabs
- `.travis.yml`
- Sign up for Travis with GitHub, then flip the toggle for the repo we want to be testing.
- We want to;
  - run tests on every commit.
  - receive an e-mail when something fails.
  - _not_ receive an e-mail when something doesn't fail.
  - know if merging a pull request will cause problems.

##### Another example
- make `grunt deploy` work
  - heroku
  - nodejitsu
  - openshift
  - github pages (example grunt task)
  - The key to these three is making a deploy as simple as git push.
  - GitHub API token
  - Secure variables for Travis

---

## Simply Pushing the Web Forward - Kris Borchers

[Slides](http://pushtalk-aerogearkb.rhcloud.com/#/), [AeroGear](https://github.com/aerogear)

- APNS (Apple Push Notification Service [IOS, Safari])
- GCM (Google Cloud Messaging [Droid])
- MPNS (Microsoft Push Notification Service [Windows 8])
- BlackBerry Push
- SimplePush (Firefox OS / Android / Desktop, and more)
- Push API (W3C) and SimplePush (Mozilla)
  - Push API  is complicated, SimplePush is not.
- Aerogear acts as a middleware for all of these different specs. (Plugs for [OpenShift](https://www.openshift.com/) and [UnifiedPush](http://aerogear.org/docs/guides/aerogear-push-ios/unified-push-server/))

---

## Creating 3D Worlds with voxel.js and jQuery - Vlad Flippov

[Site](http://voxeljs.com/)

- [ArchiveRoom](http://archiveroom.net/)
- [VoxelBuilder](http://voxelbuilder.com/)
- [VoxelDrone](https://github.com/shama/voxel-drone)

---

## How to How-to
##### Or, Tips for Effectively Educating New Developers

- _At one time, we all knew nothing about our jobs. And that's easy to forget. Learning new things is a crucial part of doing your job!_
- Why be a teacher? It enhances your leadership skills, has a positive influence on other developers careers, and the rest of the dev team will thank you.

#### Making the Most out of Teaching & Learning Styles
- Recognition of distinct learning preferences allows you to customize the teaching process.
- Two Common Learning Styles
  - Creative / Visual
    - A top-down/holistic approach can be effective.
    - Use examples and demonstartions.
    - Show where you intend to end up, and then get more granular.
  - Logical
    - Effective learning begins with understanding the *most basic elements* of the subject.
    - Problem solving is linear. If this, then that.
    - Effective learning happens step-by-step.
    - Avoid advanced concepts until the basics are down pat.
  - Match your teaching style with the developers learning style.
- Getting a sense for learning styles - ask questions!
  - How do you learn best?
  - Tell be when you struggled to learn things?
- The best predictor of future behavior, is past behavior!
- Be inspirational!
  - Encourage curiousity.
  - Have empathy.
  - Encourage an optimistic attitude.
  - Show respect.
- The best learning happens when solving real problems.
  - Get new devs in the traenches!
- Best times?
  - Pair Programming
  - Code Reviews
  - Stupid Questions Sessions
- What topics should I prioritize when teaching new developers?
  - Critical thinking
    - Teach understanding of *concepts* behind any technology used.
  - Separating Concerns
    - Don't mix structure, style, and functionality.
  - Resourcefulness
    - Get new devs using community-developed tools.
    - Small victories - the daily ego boosters. For new devs, make it as easy as possible to achieve small victories.
  - Code reusability
    - Encourage reusable CSS classes and abstracted JS functionality.
  - Debugging (tools as well)

_New devs are eager to learn and build. More experience developers can either be intimidating or inspiring. *Be inspiring.*_
A new dev's best weapon is his own curiousity. Hiring *passionate, curious* developers goes a long way in the learning process.

---

## AngularJS Directives and the Computer Science of Javascript - Burke Holland

[Slides](https://presentboldly.com/burkeholland/angularjs-and-the-computer-science-of-javascript)

- Imperative vs. Declarative
  - Markup should describe the behaviour and configuration of the UI. HTML is not adequate.
  - Declaritive - Leverage HTML attributes to specify configuration.
  - ViewModels, allows for declarative initialization and two way binding. Has a bad rap.
  - $scope and Controllers
    - $scope - The View Model
    - Controller - The context in which you work with the $scope object. The $scope is injected into the Controller by AngularJS.
    - Some popular directives:
      - Linking
      - Restriction
      - Template and Replace
      - Model Binding
      - Passing Config
      - Transclusion and Timeout

---

## Kiss My Canvas: Making and Facillitating Art with Code - Jenn Schiffer

- Example: Creating a simple basketball.
- Example: Creating a `canvas` that we can draw on.

---

##### 11 Sept 2013

---

## jQuery UI & Mobile Keynote (The Great Merger) - Scott González

- The touch events model is so fragmented on the web that it is rather difficult to implement touch events in jQuery UI
- jQuery UI is meant to be code that works everywhere.
  - Large and small devices
  - Fast and slow connections
  - Assistive tech
  - Known and unknown environments
- CSS Framework
  - Page layout
  - Responsive design
    - Responsive Grid added in jQuery Mobile, they are working on more
  - New icons
    - Defaults to SVG + external PNG. Unoptimized css, no config, works everywhere
    - Opt-In for better performance, which requires config
  - Useful with and without JavaScript
  - Simpler/Cleaner markup and CSS
  - Fewer DOM manipulations
  - Better performance
  - Useful for prototyping like Bootstrap
  - Shared between both projects
  - Preferable shared with other JS libraries
- Widgets that work everywhere
  - Widget Factory - Common API & Extensibility
  - Pointer Events - Interaction Abstraction
  - Responsive Design
- Dependency Management
  - AMD / UMD for all jQuery projects
  - Bower for all jQuery projects
  - Please only load what you need
- Web Components
  - Investigating how to transition
  - Making sure the spec solves real probles
  - Not quite there yet, if you're interested, check out [Polymer](http://www.polymer-project.org/polymer.html)

---

## In Search of Front-End Modularity - Juan Pablo Buritica
[Slides](https://speakerdeck.com/buritica/in-search-of-front-end-modularity) - Thanks [Juan](https://github.com/Buritica)!

- As our applications evolve, complexity will increase. Function, libraries, frameworks, and architectures.
- We want to build complext systems, without knowing their final state.
- Be pragmatic. Nature solves problems by breaking larger systems into modular components.
- Functional Elements
  - Reusable
  - Isolated
  - Self-contained
  - Promote separation of concerns
  - Allow composition
  - Standardized interfaces
  - Communication (optional)
- Benefits
  - Scalability
  - Structure
  - Ease of change
  - Testability
  - Lower cost
  - Flexibility
  - Augmentation
- Front-End modularity has an enemy, the code is not executed where it lives.
- We need to deliver the smallest size, in the least amount of requests.
- Modular Front-End Architectures
  - Everything is a component
  - Small Core
  - Base (DOM, Utils, etc.)
  - Messaging via events]
- Web Components
  - Templates
  - Decorators
    - Do not have a spec yet
    - Are meant to enhance or override presentation of an existing element
  - Custom Elements
    - Allow author definition of DOM elements
    - Access to prototype via nested <script>
    - Element lifecycle callbacks
    - Available via markup and scripts
  - Shadow DOM
    - Provides encapsulation and enables composition
    - The meat of web components
    - Complext topic, read [spec](http://www.w3.org/TR/shadow-dom/) for further ifo
  - HTML Imports
  - Other stuff (mutation observers, pointer events, data binding)

---

## AMD-ifying jQuery Source: Game, Consider Yourself Changed - Timmy Willison

[Slides](http://timmywil.github.io/jquery-amdify/)

- AMD: Asynchronous Module Definition
- You can now include only the modules that you will need during development, which will include it's dependencies
- AMD + Building
  - Reduce network requests
  - Reduce size
  - Flexible, pliable builds
- Future Roadmap
  - jQuery Mobile and UI to list core depencies
  - Further fragmentation
  - Grunt task for building jQuery

---

## Stop Procrastinating and Start Deferring - Julian Aubourg

[Gist of the Talk](https://gist.github.com/jaubourg/6525351)

---

## Building a Development Culture - Monika Piotrowicz

- Process - a process to support creativity, not resist it.
- Web devs should be part of the design process from the very beginning, they should not just be handed down the plans from the designers and PMs.
- The process must support learning, taking time during the week to research.
- We should work _with_ designers.
- Design and Development should always be occuring at the same time, not one before the other.
- Developer and Designer should sit together and work out the project together. It levels the playing field, and allows for a more collaborative approach to design.
- Research & Prototype - the chance to actually learn about and implement the new things that interest you.
- Prototypes are your sandbox - the freedom to focus on one problem at a time, testing early to solve it faster.
- The earlier an assumption is challenged, the easier it will be to fix.
- Devs also will get the chance to drive the design, as you can show what's possible within the code, while meeting the design specifications.
- Share & Iterate, design informs development.
- Devs in the company
  - Demo days to show off what everyone has done within the last chunk of time
  - Meetings and lightning talks, keeping up to date with what the other developers have been up to / learned
  - Hack Days & Recess - exploration and experimentation (about once per quarter for 2 or so days at a time) where they can collaborate with new people and try out new technologies.
- What _they_ gain
  - Make more informed decisions
  - Time is reduced and quality increases
  - Happy developers
- What can _we_ do?
  - Talk to your designers - your ally
  - Become an advocate - don't just vent, have meaningful discussions
  - Take the first step, even if it's on your own time, the results will speak for themselves

---

## jQuery Mobile: Optimizing Performance - Alex Schmitz

- On average, mobile is about 3x slower.
- Simplify your pages
  - Reduce the widgets in each page
  - Reduce the size of your pages
  - Limit the size of your lists and tables
  - Use pagination
- To reduce download time and http requests
  - combine all scripts
  - combine all CSS
  - minify all scripts and css
  - do not include scripts in the page
  - consider multi-page template
- Multi-page template
  - load all pages with single request
  - reduces # of http requests
  - faster page load
  - slower intial page download
  - leads to a large DOM
  - uses more system memory
  - cannot load multi-page via ajax
  - not good for large # of pages
- Custom builds
  - reduce file size
  - reduce library init time
  - reduce page init time
  - remove parts of library you aren't using

---

## jQuery + Phantom.js + Node.js = Testing and Automation Awesomesauce! - Travis Tidwell

[Slides](http://travistidwell.com/presentations/jquery-node-phantom) - [Source](https://github.com/travist/presentations)

- Not many great jQuery ports for Phantom
- Serial
  - waits for one operation to end before moving on to the next.
  - gets interesting when they depend on one another
  - and even more interesting when `getSomething` depends on an asychronous source.
  - this leads to a mess of nested code
- You can use [async.js](https://github.com/caolan/async) which will allow for a more serial type of programming, without having to nest all of your functions. (Not _too_ disimilar to `$.Deferred`, based on JavaScript promises.)
- Leveraging node.js, using jQuery.go, [nconf](https://github.com/flatiron/nconf), and [prompt](https://github.com/flatiron/prompt).

---

## Journey to the Center of jQuery - Anne-Gaelle Colom

- Interesting anecdotes on moving from GitHub committer to member of the jQuery team.
- Bits on how to contribute to jQuery.

---

## Talk To Me: Making websites accessible - Jörn Zaefferer

- Specifically, for people who can't see well.
- Convince your boss that accessibility is important, like user experience and security
  - Boosts your user experience - accessible websites are more usable for everyone
  - Support powerusers - keyboard access for everyone
  - More customers - when you can't leave home, shopping online is so much more useful
  - It's the law
  - SEO improvements
- How to test
  - W3C Validator
  - Keyboard testing
    - Put away the mouse, use tab key to navigate, try links, buttons, forms
- Virtual Cursor - going from one node to the next
- Headers, Links, Forms, and Landmarks (The GOTO of screenreaders)
  - You can specify landmarks with `role`s.
- WAI-ARIA (Web Accessibility Initiative) Accessible Rich Internet Applications
  - Screenreader testing
- Ask for forgiveness, not permission. Convince the boss. Test keyboard and screen reader. Fix by hand or with frameworks.

---

## Adaptive Images for Responsive Web Design - Christopher Schmitt

- Feature testing vs. Browser Sniffing
  - Browser width
  - Screen resolution
  - Bandwidth
- Speed tests hinder speed and user experience
  - Native speed tests on the way (in Android only now)
- IMG
  - .htaccess
  - `<picture>` and/or `srcset` attribute
  - HiSRC
    - Does a native speed test
    - Checks screen density
- Workarounds
  - background-size: auto;
    - [fittext](http://fittextjs.com/)
  - SVG
    - Use online compression tools as Illustrator generates massive SVGs
  - font-based solutions
    -  icon fonts
      -  [fontello](http://fontello.com/)
      -  [icomoon](http://icomoon.io/)