/*

  there is no reason why we couldn't just use "ConnectionsCategory" from the global types.ts file, 
  but the fact is I get constant errors about this export in particular when it is located 
  outside the backend-types folder.

*/

export const ConnectionsCategory = {
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTED_USER: "CONNECTED_USER",
  SENT_REQUEST: "SENT_REQUEST",
} as const;

export default ConnectionsCategory;
