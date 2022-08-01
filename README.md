# create-tiny-sb
Bootstrap your osu storyboard with `tiny-osbjs`.

With npm:
```bash
npm create tiny-sb
```

With yarn:
```bash
yarn create tiny-sb
```

With pnpm:
```bash
pnpm create tiny-sb
```
Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold your project with the TypeScript template, run:
```bash
# npm 6.x
npm create tiny-sb my-storyboard --template ts

# npm 7+, extra double-dash is needed:
npm create tiny-sb my-storyboard -- --template ts

# yarn
yarn create tiny-sb my-storyboard --template ts

# pnpm
pnpm create tiny-sb my-storyboard --template ts
```
There are 2 template presets: `js` and `ts`

You can use `.` for the project name to scaffold in the current directory.

## FAQ
- Why does it say that `node-dev` is not recognized blah blah?
Install `node-dev` as global dependency. 
```bash
npm i -g node-dev
```
or
```bash
yarn add -g node-dev
```
or
```bash
pnpm add -g node-dev
```

- I want to use prebuilt components but it keeps yelling something not found!
Just install it lol.

- Why don't you include them by default?
Because you may not want to use prebuilt components, so including them will just take away your precious disk space.

- Something something canvas error.
Install [`node-gyp`](https://github.com/nodejs/node-gyp#installation).

If you ran into any issues or need help, contact `Nanachi#1381` on discord.
