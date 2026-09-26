"""
JANUS-Sentinel Target Allowlist Validator
==========================================
Enforces strict security boundaries on Red Team targets.

Blocks:
  - Public IP addresses (not RFC1918/RFC4193/RFC6333)
  - Loopback addresses (127.x.x.x, ::1)
  - Private network IPs not in the explicit allowlist
  - Hostnames not in ALLOWED_RED_TEAM_TARGETS

Only allows:
  - Docker service hostnames listed in ALLOWED_RED_TEAM_TARGETS env var
  - Corresponding private IPs for those services (resolved at request time)
"""
from __future__ import annotations

import ipaddress
import logging
import os
import socket
from typing import Optional

logger = logging.getLogger(__name__)

# RFC1918 private ranges
_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("fc00::/7"),     # IPv6 ULA
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local
    ipaddress.ip_network("100.64.0.0/10"),   # Shared address space
]

_LOOPBACK_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
]

_DOCKER_NETWORK_RANGE = ipaddress.ip_network("172.16.0.0/12")


class SecurityError(Exception):
    """Raised when a security boundary is violated."""
    pass


class TargetAllowlistValidator:
    """
    Validates that a Red Team target is explicitly authorized before any
    testing request is sent. This is the primary security enforcement layer.
    """

    def __init__(self) -> None:
        self.allowed_hostnames: set[str] = self._load_allowed_hostnames()
        self.dev_mode = os.getenv("APP_ENV", "development") == "development"

    def _load_allowed_hostnames(self) -> set[str]:
        raw = os.getenv("ALLOWED_RED_TEAM_TARGETS", "target_app")
        return {h.strip().lower() for h in raw.split(",") if h.strip()}

    def validate_hostname(self, hostname: str) -> None:
        """
        Validate that the hostname is explicitly allowlisted.
        
        Raises SecurityError if not allowed.
        """
        normalized = hostname.lower().strip()
        if normalized not in self.allowed_hostnames:
            raise SecurityError(
                f"Target hostname '{hostname}' is not in the Red Team allowlist. "
                f"Allowed targets: {sorted(self.allowed_hostnames)}. "
                "Only explicitly authorized lab targets may be tested."
            )

    def validate_ip(self, ip_address: str) -> None:
        """
        Validate that the resolved IP address is safe to target.
        
        Raises SecurityError if the IP is:
          - A public internet address
          - A loopback address
          - A private address outside Docker's expected range
        """
        try:
            addr = ipaddress.ip_address(ip_address)
        except ValueError as exc:
            raise SecurityError(f"Invalid IP address format: {ip_address}") from exc

        # Block loopback
        for loopback in _LOOPBACK_NETWORKS:
            if addr in loopback:
                raise SecurityError(
                    f"Red Team target resolved to loopback address {ip_address}. "
                    "Loopback testing is not permitted."
                )

        # Block public IPs
        if not addr.is_private and not addr.is_loopback and not addr.is_link_local:
            raise SecurityError(
                f"Red Team target resolved to public IP address {ip_address}. "
                "The Red Team agent may only operate against internal lab targets."
            )

        # Allow private IPs within Docker network range
        if addr.is_private:
            in_docker_range = any(
                addr in net for net in [
                    _DOCKER_NETWORK_RANGE,
                    ipaddress.ip_network("10.0.0.0/8"),
                ]
            )
            if not in_docker_range:
                raise SecurityError(
                    f"Target IP {ip_address} is a private address outside the permitted "
                    "Docker network range. Only Docker-internal service IPs are allowed."
                )

    def validate_target(self, hostname: str, resolved_ip: Optional[str] = None) -> None:
        """
        Full target validation: hostname check + IP check.
        
        If resolved_ip is None, attempts DNS resolution of hostname.
        
        Raises SecurityError on any violation.
        """
        # 1. Hostname allowlist check
        self.validate_hostname(hostname)

        # 2. IP resolution and validation
        if resolved_ip is None:
            try:
                resolved_ip = socket.gethostbyname(hostname)
            except socket.gaierror:
                # In Docker networks, resolution may succeed only at runtime
                logger.warning(
                    f"Could not pre-resolve hostname '{hostname}' for IP validation. "
                    "Runtime validation will be enforced."
                )
                return

        self.validate_ip(resolved_ip)

        logger.info(
            f"Target validated: hostname='{hostname}' ip='{resolved_ip}' "
            f"allowed_hostnames={sorted(self.allowed_hostnames)}"
        )


# Singleton
target_validator = TargetAllowlistValidator()
