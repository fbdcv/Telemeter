export const host = "http://192.168.2.4:5000";
// export const host = "http://192.168.43.235:5000";
export const registerRoute = `${host}/api/auth/register`;
export const loginRoute = `${host}/api/auth/login`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const friendsRoute = `${host}/api/auth/friends`;
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;

export const friendRequestRoute = `${host}/api/system/friendRequest`;
export const getFriendRequestRoute = `${host}/api/system/getFriendRequest`;

export const getFriendsRoute = `${host}/api/auth/getFriends`;
export const beFriendsRoute = `${host}/api/auth/beFriends`;
export const notBeFriendsRoute = `${host}/api/auth/notBeFriends`;

export const getAvatarRoute = `${host}/api/avatar/getavatar`;

export const sendCaptchaRoute = `${host}/api/captcha/sendCaptcha`;
