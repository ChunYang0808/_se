#!/usr/bin/env python3
"""mycurl - A simple CLI HTTP client like curl."""

import argparse
import sys

import requests


def parse_args():
    parser = argparse.ArgumentParser(
        prog="mycurl",
        description="A simple CLI HTTP client",
    )
    parser.add_argument("url", help="Target URL (e.g. https://example.com)")
    parser.add_argument(
        "-X", "--request", default=None,
        help="HTTP method (GET, POST, PUT, DELETE, etc.)",
    )
    parser.add_argument(
        "-H", "--header", action="append", default=[],
        metavar="KEY: VALUE",
        help="Custom header, can be used multiple times",
    )
    parser.add_argument(
        "-d", "--data", default=None,
        help="Request body data (implies POST if -X not set)",
    )
    parser.add_argument(
        "-i", "--include-headers", action="store_true",
        help="Include response headers in output",
    )
    parser.add_argument(
        "--timeout", type=int, default=10,
        help="Request timeout in seconds (default: 10)",
    )
    return parser.parse_args()


def build_headers(header_list):
    headers = {}
    for item in header_list:
        if ":" not in item:
            print(f"Error: Invalid header format '{item}', expected 'Key: Value'", file=sys.stderr)
            sys.exit(1)
        key, value = item.split(":", 1)
        headers[key.strip()] = value.strip()
    return headers


def send_request(url, method, headers, data, timeout):
    try:
        if data is not None:
            if method is None:
                method = "POST"
            resp = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                data=data,
                timeout=timeout,
            )
        else:
            if method is None:
                method = "GET"
            resp = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                timeout=timeout,
            )
        return resp
    except requests.exceptions.ConnectionError:
        print(f"Error: Failed to connect to {url}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(f"Error: Request timed out after {timeout}s", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.MissingSchema:
        print(f"Error: Invalid URL '{url}' - missing scheme (http:// or https://)", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.InvalidURL:
        print(f"Error: Invalid URL '{url}'", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def display_response(resp, include_headers):
    if include_headers:
        print(f"\n--- Response Headers ---")
        print(f"{resp.status_code} {resp.reason}")
        for key, value in resp.headers.items():
            print(f"{key}: {value}")
        print()

    print(f"Status: {resp.status_code} {resp.reason}")
    print()
    print(resp.text)


def main():
    args = parse_args()
    headers = build_headers(args.header)
    resp = send_request(args.url, args.request, headers, args.data, args.timeout)
    display_response(resp, args.include_headers)


if __name__ == "__main__":
    main()
