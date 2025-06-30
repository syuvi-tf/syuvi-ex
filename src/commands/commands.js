import link from "./public/link.js";
import profile from "./public/profile.js";
import randommap from "./public/randommap.js";
import submit from "./public/submit.js";
import toptimes from "./public/toptimes.js";

import createtourney from "./private/createtourney.js";
import echo from "./private/echo.js";
import forcesubmit from "./private/forcesubmit.js";
import refreshdivisions from "./private/refreshdivisions.js";
import removetime from "./private/removetime.js";
import setdisplayname from "./private/setdisplayname.js";
import setdivision from "./private/setdivision.js";
import settourneymap from "./private/settourneymap.js";
import verify from "./private/verify.js";

//import forcetourneystate from "./test/forcetourneystate.js";

export const allCommands = [
  link,
  profile,
  randommap,
  submit,
  toptimes,
  createtourney,
  echo,
  forcesubmit,
  refreshdivisions,
  removetime,
  setdisplayname,
  setdivision,
  settourneymap,
  verify,
  //  forcetourneystate,
];
