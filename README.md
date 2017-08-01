A Small Thumbnail Generator/Viewer
==================================

This is a very simple little project that takes the URL of an image, computes some statistics and a thumbnail for it, stores the thumbnail in S3, and returns the URL to the thumbnail.

I built this because I need some way of generating thumbnails that isn't gonna die all the time, for my RSS aggregator, and the current approach (generate thumbs from the web process) keeps running out of memory. I actually deploy the core of this into AWS Lambda so that I don't worry too much about provisioning capacity for processing images.

Actually Deploying
------------------

1. Use the menu to select "Export to github".
2. Go to github, create a pull request from 'glitch' to 'master'.
3. Wait for Travis to build the repo.
4. Close the pull request.

Travis should build master and deploy it to lambda. Hooray!

(If you remix this on Glitch you're going to need to fix up the environment variables, and also the .travis.yml so that travis can deploy for you too. Specifically, you'll need to change the AWS identities and re-encrypt `deploy.secret_access_key`.)

Built with Glitch
-----------------
**Glitch** is the friendly commmunity where you'll build the app of your dreams. Glitch lets you instantly create, remix, edit, and host an app, bot or site, and you can invite collaborators or helpers to simultaneously edit code with you.

Find out more [about Glitch](https://glitch.com/about).

\ ゜o゜)ノ
