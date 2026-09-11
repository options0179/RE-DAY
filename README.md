# RE:DAY

RE:DAY is a career-day simulation service designed to work with a single
Microsoft Copilot Agent, modular Skills, and a secured MCP gateway.

## Repository layout

- `backend/` - server contracts, authorization boundaries, repositories, and MCP gateway
- `frontend/` - Next.js web experience
- `docs/` - architecture and delivery notes

The MVP intentionally uses one orchestrating Agent. Multi-agent delegation is
deferred until the single-session flow and state model are stable.

## Development

Install dependencies independently in `backend/` and `frontend/`. Environment
variables must be supplied through local, untracked `.env` files.
