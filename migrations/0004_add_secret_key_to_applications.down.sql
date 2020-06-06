begin;

alter table applications drop column secret_key;
alter table access_tokens drop column application_id, drop column activation_key, drop column activated;

commit;
