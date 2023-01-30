import State from '../src/models/state';
import * as api from '../src/spotify/apiController';
import fs  from 'fs';

require('dotenv').config();

describe('API flow tests', function() {
  let state = new State();

    test('Token refresh', async () => {
      expect(api.waitForToken(state, 10000)).resolves.toBe(true);
    });

    test('Refresh token file', () => {
      expect(fs.existsSync('token.txt')).toBe(true);
    });

    test('Request Song Playing', async () =>{
      let res:(api.ApiResponse|null) = null;
      await api.fetchCurrentlyPlaying(state).then(
        (data) => {
          res = data;
        }
      ).catch(() => {
        throw new Error('Error fetching currently playing');
      });
      console.log(state.headers);
      expect(res).not.toBeNull();
      expect(res!.status).not.toBe(api.ApiStatusCode.Error);
      expect(res!.status).not.toBe(api.ApiStatusCode.Unauthorized)
      console.log(res);
    });
  });
