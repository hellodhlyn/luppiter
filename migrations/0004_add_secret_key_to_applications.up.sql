begin;

alter table applications add column secret_key varchar (40) not null default '';

alter table access_tokens
  add column application_id integer not null default -1,
  add column activation_key varchar(40) not null default '',
  add column activated boolean not null default false;

create index access_tokens_application_id on access_tokens (application_id);
create index access_tokens_activation_key on access_tokens (activation_key);

commit;
