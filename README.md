![ZestyAPI](./assets/logo.png)

[![Releases](https://img.shields.io/github/package-json/v/re621/ZestyAPI/main?color=blue&label=version&style=flat-square)](https://github.com/re621/ZestyAPI/releases)
[![checks](https://img.shields.io/github/workflow/status/re621/ZestyAPI/Unit%20Tests?style=flat-square)](https://github.com/re621/ZestyAPI/actions/)
[![Issues](https://img.shields.io/github/issues/re621/ZestyAPI?&style=flat-square)](https://github.com/re621/ZestyAPI/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/re621/ZestyAPI?style=flat-square)](https://github.com/re621/ZestyAPI/pulls)

ZestyAPI is a JavaScript wrapper for the public API on e621.net.  
It can be used as a node package, as well as in a browser.


```
const E621 = ZestyAPI.connect({ userAgent: "zesty/example" });
E621.Posts.get(12345).then((result) => console.log(result));
```

# Usage

ZestyAPI is instantiated via the `connect()` method.
An object will be returned, through which endpoints can be accessed.

## Options
| Option | Type | Default | Required | Notes |
|:---:|:---:|:---:|:---:|:---:|
| `userAgent` | `string` |  | yes | User-agent used for requests to the API. Required. |
| `rateLimit` | `number` | 500 | no | How quickly requests can be sent (ms). 500 minimum. |
| `domain` | `string` | `https://e621.net` | no | Base for building API requests. Must be a valid URL. |
| `debug` | `boolean` | `false` | no | Enables debug messages in the log. |

### User-Agent
Note that a custom `userAgent` is required by the e621 API for all requests.

Please, pick a descriptive User-Agent for your project.  
You are encouraged to include your e621 username so that you may be contacted if your project causes problems.  
**Do NOT impersonate a browser user agent, as this will result in you being blocked.**  
An example user-agent would be `MyProject/1.0 (by username on e621)`.

### Authentication
When used in a browser on e621.net, you may use the CSRF token available throw a meta-tag in order to authenticate.  
Otherwise, you may need to use the username / api key pair.

Authentication is done by calling a `<instance>.login()` method, and passing the credentials to it.  
CSRF token may be passed as-is:
```
const E621 = ZestyAPI.connect({ userAgent: "zesty/example" });
E621.login("your-csrf-token-here");
```
Meanwhile, the username / key pair must be passed as an object:
```
const E621 = ZestyAPI.connect({ userAgent: "zesty/example" });
E621.login({
    username: YourUsername,
    apiKey: YourAPIKey
});
```

# Contributing
## Testing
This project includes some endpoints and features that are only usable by e621
staff members, such as staff notes. If you'd like to run the full test suite,
you can run the e621ng developer environment locally and pass in localhost for
the domain (along with the appropriate credentials) to test everything properly.
