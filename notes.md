# CS 260 Notes

Just adding notes, I know git pretty well. We will see how this goes!



[My startup - Simon](https://simon.cs260.click)

[IP Address of Server]((http://54.81.96.130/))

[My startup - inkspace](https://startup.inkspace.click/)



## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## AWS

My IP address is: 54.81.96.130
Remote: ssh -i \[mykeyhere].pem ubuntu@54.205.28.50


## Caddy

No problems worked just like it said in the [instruction](https://github.com/webprogramming260/.github/blob/main/profile/webServers/https/https.md).

## HTML

I have done the simple CodePen examples, and learned more about being able to see how my work actually looks.

This was easy. I was careful to use the correct structural elements such as header, footer, main, nav, and form. The links between the three views work great using the `a` element.

The part I didn't like was the duplication of the header and footer code. This is messy, but it will get cleaned up when I get to React.

## CSS

I did simple, custom CSS with no framework.

- Used a tiny reset and consistent typography for readable defaults.
- Kept layout full-width so it naturally fits any screen size.
- Styled nav links, sections, forms, and buttons with minimal borders and spacing.

## React Part 1: Routing

Setting up Vite and React was pretty simple. I had a bit of trouble because of conflicting CSS. This isn't as straight forward as you would find with Svelte or Vue, but I made it work in the end. If there was a ton of CSS it would be a real problem. It sure was nice to have the code structured in a more usable way.
Deploy using ./deployReact.sh -k 260startupkey.pem -h startup.inkspace.click -s startup

## React Part 2: Reactivity

This was a lot of fun to see it all come together. I had to keep remembering to use React state instead of just manipulating the DOM directly.

Handling the toggling of the checkboxes was particularly interesting.

```jsx
<div className="input-group sound-button-container">
  {calmSoundTypes.map((sound, index) => (
    <div key={index} className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        value={sound}
        id={sound}
        onChange={() => togglePlay(sound)}
        checked={selectedSounds.includes(sound)}
      ></input>
      <label className="form-check-label" htmlFor={sound}>
        {sound}
      </label>
    </div>
  ))}
</div>
```

## DB

using mongodb

Moved users, sessions, and attempts into MongoDB instead of keeping them in memory.

The main thing to watch was doing the auth migration in the right order. If I changed writes before reads, login/session auth could break for a bit.

Also nice to have the DB ping and index creation happen on startup so bad config fails fast instead of making bugs later.

## WebSocket

Kept this one simple by attaching `ws` to the existing Express server instead of creating a second backend service or port.

The cleanest shape was:

- save attempts with the existing HTTP `POST /api/attempts`
- broadcast only after the DB write succeeds
- keep one socket path: `/ws`
- keep one message envelope: `{ type, payload }`

The browser side was easiest once I used one shared WebSocket client at the app level instead of opening a new socket inside each page.

For local dev, Vite needs to proxy both `/api` and `/ws` to `http://127.0.0.1:4000` or the frontend and backend do not behave like production.

The ping/pong heartbeat is worth keeping because dead sockets otherwise stick around longer than you expect during testing.
