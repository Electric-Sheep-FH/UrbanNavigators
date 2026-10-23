-- Une base et un rôle par domaine (ADR-006, ARC-001) : un service n'a aucun droit sur la base d'un autre.
-- Mots de passe de DÉVELOPPEMENT uniquement (Docker Compose, cluster local).
-- En staging/production, les identifiants viennent d'un gestionnaire de secrets.

CREATE ROLE identity LOGIN PASSWORD 'identity';
CREATE DATABASE identity OWNER identity;
REVOKE ALL ON DATABASE identity FROM PUBLIC;

CREATE ROLE mobility LOGIN PASSWORD 'mobility';
CREATE DATABASE mobility OWNER mobility;
REVOKE ALL ON DATABASE mobility FROM PUBLIC;

CREATE ROLE operations LOGIN PASSWORD 'operations';
CREATE DATABASE operations OWNER operations;
REVOKE ALL ON DATABASE operations FROM PUBLIC;

CREATE ROLE notifications LOGIN PASSWORD 'notifications';
CREATE DATABASE notifications OWNER notifications;
REVOKE ALL ON DATABASE notifications FROM PUBLIC;
