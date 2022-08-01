import { createContext, generateStoryboardOsb, useContext } from '@osbjs/tiny-osbjs'
import { writeFileSync } from 'fs'
import path from 'path'
// remember to update path to your beatmap folder
import { beatmapFolder, storyboardFileName } from './config'

useContext(createContext())

// your storyboard start here

writeFileSync(path.join(beatmapFolder, storyboardFileName), generateStoryboardOsb(), 'utf8')
