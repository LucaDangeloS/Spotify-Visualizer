import State from 'state';
import { APIFetcher, ApiResponse } from 'api_controller';
import fs  from 'fs';

require('dotenv').config();

describe('API flow tests', function() {
  let state = new State();
  let api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state);

    test('Token refresh', async () => {
      expect(api.waitForToken(10000)).resolves.toBe(true);
    });

    test('Refresh token file', () => {
      expect(fs.existsSync('token.txt')).toBe(true);
    });

    test('Request Song Playing', async () =>{
      let res = null
      res = await api.fetchCurrentlyPlaying();
      expect(res).not.toBeNull();
      expect(res).not.toBe({status: ApiResponse.Error});
      api = null;
      state = null;
    });
  });
