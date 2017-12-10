# OWFWidgetBase3
## Base widget example on how to use Require/JQuery/Bootstrap/Handlebars etc

#### The widget displays buttons in title bar, using Bootstrap themes for grid layout.  It also uses Handlebars to create four components Card, CardDashboard, CardProperty, and CardWidget; to display details of the user properties.

#### The widget also uses dynamic loading of content (CSS and JS) in index.html to ensure caching is disabled for development environment.

#### Custom events are linked to each card type - for demo: (a) OWF, User, UUID, and Summary properties use base Card, (b) Group properties use CardProperty, (c) Widget properties use CardWidget, and (d) Dashboard properties use CardDashboard to render content.  Each card has its click event linked.

#### All external dependencies are stored in "vendor" folder.
---
#### Screen captures:

![alt text][capture1]

[capture1]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-1.PNG "Capture 1"

[<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-2.PNG" alt="Capture 2" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-3.PNG" alt="Capture 3" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-4.PNG" alt="Capture 4" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-5.PNG" alt="Capture 5" width="100px">]

---
```
Directory Structure
(root)
|- descriptro
|- vendor
|- widget
|  |- css
|     |- base_style.css
|     |- widget_style.css
|  |- images
|     |- event_note_24px.svg
|     |- event_note_48px.svg
|     |- loading_blue.gif
|  |- js
|     |- card
|        |- card.css
|        |- card.html
|        |- card.js
|        |- cardDashboard.css
|        |- cardDashboard.html
|        |- cardDashboard.js
|        |- cardDashProperty.css
|        |- cardDashProperty.html
|        |- cardDashProperty.js
|        |- cardDashWidget.css
|        |- cardDashWidget.html
|        |- cardDashWidget.js
|     | config.js
|     | widget.js
| | main.js
| app.js
| index.html
| server.js
```
---
 License: MIT
