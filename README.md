# OWFWidgetBase3
## Base widget example on how to use Require/Bootstrap/Handlebars etc

#### The widget displays buttons in title bar, using Bootstrap themes for grid layout.  It also uses Handlebars to create four components Card, CardDashboard, CardProperty, and CardWidget; to display details of the user properties.

#### The widget also uses dynamic loading of content (CSS and JS) in index.html to ensure caching is disabled for development environment.
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
