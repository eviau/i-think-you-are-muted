# LIKELIKE Online

The tiniest MMORPG. Choose an avatar and hang out with your friends in a virtual version of [LIKELIKE](http://likelike.org/) a videogame gallery in Pittsburgh, PA.

This project was created during the COVID-19 quarantine and was meant to evoke the social aspect of LIKELIKE's exhibitions.  
You can mod it to create your own virtual exhibitions or multi-user environments.  
It's designed to be extensible by just editing the rooms.js file and a few settings at the beginning of server.js and sketch.js.

The code is extensively commented but it was put together very quickly (about a week) so it's not meant to be a robust, beginner-friendly tool. You'll need some node.js and javascript knowledge to adapt it to your needs. Use at your own risk.

LIKELIKE Online is based on socket.io, [p5.js](https://p5js.org/), and the add-on [p5.play](https://molleindustria.github.io/p5.play/).  
LIKELIKE Online is a project by [Molleindustria](http://molleindustria.org/).  

Licensed under a GNU Lesser General Public License v2.1.

## Publishing on Glitch

**Glitch** is a community and a series of friendly tools to develop node based applications.
Glitch provides free hosting for node projects. Most web hosts don't give you that degree of access. Another popular platform is heroku.
Glitch offers a code editor, file storage, and an intergrated terminal. You can create node applications from scratch via browser.
Glitch allows you to browse and remix other people projects.
[glitch.com](https://glitch.com/)

**Warning** A free Glitch account has a limit of 4000 requests per hour, this projects loads a lot of individual image assets so you can go over the limit pretty easily. Consider purchasing a paid account for a public-facing project.

This project is already structured for glitch deployment with a server.js on the root and a "public" folder.
You can deploy this app to Glitch via github or [other git repositories](https://medium.com/glitch/import-code-from-anywhere-83fb60ea4875)

Alternatively you can follow this process to deploy it starting from zip:

* Create a ZIP file of the project.
* Upload it to the assets folder in your project, click it and click **Copy Url**
* Navigate to **Settings > Advance Options > Open Console** in your project
* In the console, first you want to pull the zip file from the url (keep file.zip, it's just a temporary file)  
`wget -O file.zip https:///url-to-your-zip`  

* Extract it to the current directory  (don't replace file.zip)
`unzip file.zip -d .`  

* Remove the zip file  
`rm file.zip`  

* Refresh our app so the new files are shown in the editor  
`refresh`  

* Finally make sure this line is present to the package.json, this is equivalent to launching the server on the local terminal:  
`"scripts": { "start": "node server.js" },`

* The .env file (containing the private variables) probably won't be zipped or overwritten so if you have to copy its content manually in the glitch editor
