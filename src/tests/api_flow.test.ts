import State from '../state';
import * as api from '../api_controller';
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
      let res = null
      res = await api.fetchCurrentlyPlaying(state);
      expect(res).not.toBeNull();
      expect(res).not.toBe({status: api.ApiStatusCode.Error, data: null});
    });
  });
