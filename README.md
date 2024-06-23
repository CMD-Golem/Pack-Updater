# Data Pack Updater
Tool for batch updating the pack version in pack.mcmeta file and file name of Data Packs or Ressource Packs.

[Built with Tauri](https://tauri.app/) and [JSZip](https://stuk.github.io/jszip/)

## Folder structer
You must have all the different versions of a pack in one main folder. You can put the name of the Minecraft version wherever you want, but only once.
If you are using a data pack and a resource pack, you can put both in the same folder or one of them in a subfolder. The only important thing is that all Data Pack versions are in the same folder and all Resource Pack versions are in the same folder.
Note that all resource packs must have the same identifier in their name in order to be correctly identified by the program if they are located in the same folder as the data packs.
If you have an "Addon Pack" for your main package, you can also place this in a subfolder.

* Pack 1
    * [1.17] Pack name Resource Pack v1
    * [1.17] Pack name v1
    * [1.18] Pack name Resource Pack v1
    * [1.18] Pack name v1
    * [1.19] Pack name Resource Pack v2
    * [1.19] Pack name v2
* Pack 2
    * Pack name Resource Pack for 1.17 v1
    * Pack name for 1.17 v1
    * Pack name Resource Pack for 1.18 v1
    * Pack name for 1.18 v2
    * Pack name Resource Pack for 1.19 v2
    * Pack name for 1.19 v2
* Pack 3
    * [1.17] Pack name v1
    * [1.18] Pack name v1
    * [1.19] Pack name v2
    * Addon Pack
        * [1.17] Addon Pack name v1
        * [1.18] Addon Pack name v1
* Pack 3
    * [1.17] Pack name v1
    * [1.18] Pack name v1
    * [1.19] Pack name v2
    * Resource Packs
        * Pack name Resource Pack for 1.17 v2
        * Pack name Resource Pack for 1.18 v1
        * Pack name Resource Pack for 1.19 v2

## Visualisation of the packs in the programm
The data packs are all listed in a table. The first column contains the pack name, i.e. the name of the main folder plus the name of the subfolder, if available.
In the second column, all files in the corresponding folder are listed in a drop-down menu.
And in the third column, the name for the new file is written. This name can be edited individually.

## Input fields
All input fields are optinal.
| Input | Description |
| ------------- | ------------- |
| Identifier of the Pack to be selected | Automatically selects the file with the defined identifier in its file name |
| New Identifier | Will replace the Identifier of the Pack to be selected when selecting the pack type |
| New Pack Format | New pack version for the pack.mcmeta file |
| Resource Pack Identifier | Identifier in the file name of resource packs used to hide or show them depening on the selected file type<br>Needs to be defined when data pack and resource pack are in the same folder |


