/*

  there is no reason why we couldn't just use "TilkEventType" from the global types.ts file, 
  but the fact is I get constant errors about this export in particular when it is located 
  outside the backend-types folder.

*/

export const TilkEventType = {
  MESSAGE: "MESSAGE",
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTION_APPROVAL: "CONNECTION_APPROVAL",
  LOOKING_TO_DO_SAME_THINGS: "LOOKING_TO_DO_SAME_THINGS",
} as const;

export default TilkEventType;
