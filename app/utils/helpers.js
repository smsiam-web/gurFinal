export const setBackgroundImage = (url = "", style = {}) => ({
  backgroundImage: `url(${url})`,
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  ...style,
});

// create random unique id
export const uuid = () => {
  return "xxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

//coma separated number
export const numberWithCommas = (x) => {
  x = x.toString() + ".00";
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
  return x;
};

// Time ago
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval + " Years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + " Months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + " Days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + " Hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + " Minutes";
  }
  return Math.floor(seconds) + " seconds";
};

// get asPath
export const getPage = () => {
  if (typeof window === "undefined") return null;
  const { host } = window.location;
  let isDev = host.includes("localhost");
  let splitHost = host.split(".");

  if ((!isDev && splitHost.length === 3) || (isDev && splitHost.length === 2)) {
    let page = splitHost[0];
    if (page === "www") {
      return null;
    }

    return page;
  }
};

// Get page server
export const getPageServer = (host) => {
  let isDev = host.includes("localhost");
  let splitHost = host.split(".");

  if ((!isDev && splitHost.length === 3) || (isDev && splitHost.length === 2)) {
    let page = splitHost[0];
    if (page === "www") {
      return null;
    }

    return page;
  }
};
