import axios, { AxiosError, AxiosResponse } from "axios";
import State from "../src/state";
import * as api from '../src/api_controller';
require('dotenv').config();

async function main() {
    const state: State = new State(false,  () => {});
    let songs = [
        'Birthday',
        '11dFghVXANMlKmJXsNCbNl',
        'The perfect girl',
        '5RBOcBpJXaNnHCGViJmYhh',
        'It was a good day',
        '2qOm7ukLyHUXWyR4ZWLwxA',
        'Dare',
        '4Hff1IjRbLGeLgFgxvHflk',
        'Hot N Heavy',
        '6XHdnKvleZOUyrgnXbe3x5',
        'Eclipse',
        '7AZzbasAkSZvkN2q6Ar6Sr',
        'Outerbody',
        '6kLaAYcRc5x5AFrhALbxQN',
        'Apocalypse',
        '0yc6Gst2xkRu0eMLeRMGCX'
    ];
    await api.waitForToken(state);
    let data = {};

    for (let i = 0; i < songs.length/2; i++) {
        await axios.get("https://api.spotify.com/v1/audio-features/"+songs[i*2 + 1], {headers: state.headers})
            .then((response: AxiosResponse) => {
                data[songs[i*2]] = {
                    danceability: response.data.danceability,
                    energy: response.data.energy,
                    speechiness: response.data.speechiness,
                    acousticness: response.data.acousticness,
                    instrumentalness: response.data.instrumentalness,
                    liveness: response.data.liveness,
                    valence: response.data.valence,
                }
            })
            .catch((err: AxiosError) => {
                console.error(err.message);
            });
    }

    console.log(data);
}

main();

//  [-] valence -> purple
//  [+-] valence -> orange
//  [+] valence -> red
// [++] valence -> Light Blue

// [-] danceability -> Blue
// [+-] danceability -> 
// [+] danceability -> Yellow

// [+] energy -> nothing 
// [-] energy -> dark blue