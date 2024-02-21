import State from '../src/models/state';
import * as api from '../src/spotify/apiController';
import fs  from 'fs';
import { syncOffsetThreshold as defaultSyncOffsetThreshold} from "../src/config/config.json";

require('dotenv').config();

describe('API flow tests', function() {
  let state = new State();

    test('Token refresh', async () => {
      expect(await api.waitForToken(state)).toBe(true);
    });

    test('Refresh token file', () => {
      expect(fs.existsSync('token.txt')).toBe(true);
    });

    test('Request Song Playing', async () => {
      let res:(api.ApiResponse|null) = null;
      await api.fetchCurrentlyPlaying(state, defaultSyncOffsetThreshold).then(
        (data) => {
          res = data;
          console.log(data);
        }
      ).catch(() => {
        throw new Error('Error fetching currently playing');
      });
      expect(res).not.toBeNull();
      expect(res!.status).not.toBe(api.ApiStatusCode.Error);
      expect(res!.status).not.toBe(api.ApiStatusCode.Unauthorized)
    });
  });
