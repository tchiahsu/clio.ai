import crypto from "crypto";

// store session information: id and expiration time
type Session = {
    userId: number;
    expiration: number;
};

// map session to user id and expiration time
const sessions = new Map<string, Session>();

// set how long session should be valid before it expires 
const session_time = 1000 * 60 * 60 * 5;

// create a session when user logs in 
export function createSession(userId: number){
    // hex the sesion id 
    const sessionId = crypto.randomBytes(24).toString("hex");
    // calculate time to expiration
    const expiration = Date.now() + session_time;
    // save sesion information 
    sessions.set(sessionId, {userId, expiration});
    return {sessionId, expiration};
}

// called in each session to check if user is logges in 
export function getSession(sessionId: string | undefined){
    if (!sessionId) return undefined;
    // check if user id logged in 
    const sessionInfo = sessions.get(sessionId);
    // if ID is not found then user is not logged in 
    if (!sessionInfo) return undefined;
    // if session is expired, session gets deleted and user is logged out
    if (Date.now () > sessionInfo.expiration){
        sessions.delete(sessionId);
        return undefined;
    }

    return sessionInfo;
}

// completely delete session from memory (in cases where user updates password, etc)
export function deleteSession (sessionId: string | undefined){
    if (!sessionId) return;
    sessions.delete(sessionId);
}