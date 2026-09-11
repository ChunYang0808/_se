# mycurl

A simple CLI HTTP client written in Python.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
python mycurl.py [options] <URL>
```

### Options

| Option | Description |
|--------|-------------|
| `-X, --request METHOD` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `-H, --header "Key: Value"` | Custom header (can repeat) |
| `-d, --data DATA` | Request body data (implies POST) |
| `-i, --include-headers` | Show response headers |
| `--timeout SECONDS` | Timeout in seconds (default: 10) |

## Examples

```bash
# GET request
python mycurl.py https://httpbin.org/get

# POST request with data
python mycurl.py -X POST -d "name=Tom&age=20" https://httpbin.org/post

# Custom header
python mycurl.py -H "User-Agent: MyCurl/1.0" https://httpbin.org/get

# Show response headers
python mycurl.py -i https://httpbin.org/get
```
