#!/usr/bin/env python3
"""
Add 4× A records for greatsage.org (apex) → GitHub Pages.
Uses Namecheap API. Reads credentials from Keychain (same as glasses CNAME script).
Preserves all other records (MX, CNAME glasses, etc.). Run from a machine whose
public IP is whitelisted in Namecheap API Access.
"""

import json
import subprocess
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

SLD = "greatsage"
TLD = "org"
TTL = "1800"
# GitHub Pages apex IPs
GITHUB_A_IPS = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153",
]
NS = "http://api.namecheap.com/xml.response"


def get_public_ip() -> str:
    try:
        with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=5) as r:
            return json.loads(r.read().decode())["ip"]
    except Exception as e:
        print("Could not get public IP:", e)
        sys.exit(1)


def get_keychain_creds():
    try:
        out = subprocess.run(
            ["security", "find-generic-password", "-s", "namecheap:api", "-w"],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(out.stdout.strip())
        return data["api_user"], data["api_key"]
    except (subprocess.CalledProcessError, json.JSONDecodeError, KeyError):
        print("Keychain read failed. Run:")
        print('  security add-generic-password -a "namecheap" -s "namecheap:api" -w \'{"api_user":"USER","api_key":"KEY"}\'')
        print("See Janet-Personas/.../24_NAMECHEAP_API_SETUP.md")
        sys.exit(1)


def namecheap_request(api_user, api_key, client_ip, command, extra):
    base = "https://api.namecheap.com/xml.response"
    params = {
        "ApiUser": api_user,
        "ApiKey": api_key,
        "UserName": api_user,
        "ClientIp": client_ip,
        "Command": command,
    }
    params.update(extra)
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(base, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode()


def get_hosts(api_user, api_key, client_ip):
    resp = namecheap_request(
        api_user, api_key, client_ip,
        "namecheap.domains.dns.getHosts",
        {"SLD": SLD, "TLD": TLD},
    )
    root = ET.fromstring(resp)
    errs = root.find(f".//{{{NS}}}Errors")
    if errs is not None and len(errs) > 0:
        for err in errs:
            print("API error:", err.get("Number", ""), err.text or "")
        sys.exit(1)
    hosts = []
    for host in root.findall(f".//{{{NS}}}Host"):
        hosts.append({
            "Name": host.get("Name", ""),
            "Type": host.get("Type", ""),
            "Address": host.get("Address", ""),
            "TTL": host.get("TTL", str(TTL)),
            "MXPref": host.get("MXPref", "10"),
        })
    return hosts


def set_hosts(api_user, api_key, client_ip, hosts):
    params = {"SLD": SLD, "TLD": TLD}
    for i, h in enumerate(hosts, 1):
        params[f"HostName{i}"] = h["Name"]
        params[f"RecordType{i}"] = h["Type"]
        params[f"Address{i}"] = h["Address"]
        params[f"TTL{i}"] = h.get("TTL", str(TTL))
        if h["Type"] == "MX":
            params[f"MXPref{i}"] = h.get("MXPref", "10")
    resp = namecheap_request(
        api_user, api_key, client_ip,
        "namecheap.domains.dns.setHosts",
        params,
    )
    root = ET.fromstring(resp)
    errs = root.find(f".//{{{NS}}}Errors")
    if errs is not None and len(errs) > 0:
        for err in errs:
            print("API error:", err.get("Number"), err.text or "")
        sys.exit(1)
    result = root.find(f".//{{{NS}}}DomainDNSSetHostsResult")
    if result is not None and result.get("IsSuccess") == "true":
        print("Success: apex A records set for greatsage.org")
    else:
        print("Unexpected response:", resp[:500])


def main():
    print("Fetching public IP (must be whitelisted in Namecheap)...")
    client_ip = get_public_ip()
    print("Client IP:", client_ip)

    print("Reading credentials from Keychain...")
    api_user, api_key = get_keychain_creds()

    print("Getting current DNS records for", SLD + "." + TLD, "...")
    hosts = get_hosts(api_user, api_key, client_ip)

    # Remove existing A records for @ (apex)
    hosts = [h for h in hosts if not (h["Name"] == "@" and h["Type"] == "A")]

    # Add 4× A for apex (GitHub Pages)
    for ip in GITHUB_A_IPS:
        hosts.append({
            "Name": "@",
            "Type": "A",
            "Address": ip,
            "TTL": str(TTL),
        })

    print("Setting DNS (4× A for @)...")
    set_hosts(api_user, api_key, client_ip, hosts)


if __name__ == "__main__":
    main()
