# OWFWidgetBase3
## Base widget example on how to use Require/Bootstrap/Handlebars etc

#### The widget displays buttons in title bar, using Bootstrap themes for grid layout.  It also uses Handlebars to create four components Card, CardDashboard, CardProperty, and CardWidget; to display details of the user properties.

#### The widget also uses dynamic loading of content (CSS and JS) in index.html to ensure caching is disabled for development environment.
---
#### Screen captures:

![alt text][capture1]
![alt text][capture2 = 100]
![alt text][capture3]
![alt text][capture4]
![alt text][capture5]

[capture1]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-1.PNG "Capture 1"
[capture2]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-2.PNG "Capture 2"
[capture3]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-3.PNG "Capture 3"
[capture4]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-4.PNG "Capture 4"
[capture5]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-5.PNG "Capture 5"

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
