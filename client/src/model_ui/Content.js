import React from 'react'
import './Content.css'

function Content() {
    return (
        <main>
            <div id="content-banner">
                <span id="channel-type-icon">#</span>
                <p id="channel-name">random-yt-vids</p>
                <span id="channel-description">post entertaining youtube videos here that arnt actually trash</span>
            </div>
            <div id="content">
                <ul>
                    <li id="input-container">
                        <input></input>
                    </li>
                    <li className="message-container">
                        test
                    </li>
                </ul>
            </div>
        </main>
    )
}

export default Content
