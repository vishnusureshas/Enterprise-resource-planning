--
-- PostgreSQL database dump
--

\restrict sudEgRShnpWp0LIHzYPyQd2BbRd2DpBkNrTXfc3ciE8FD8Bm0MmhDx3gb16vyiR

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.organizations (id, name, slug, status, settings, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.users (id, organization_id, email, password_hash, first_name, last_name, phone, avatar_url, status, last_login, password_reset_token, password_reset_expires, mfa_enabled, mfa_secret, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.audit_logs (id, organization_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.permissions (id, name, description, category, created_at) FROM stdin;
a61cf047-9b37-4b2a-bd92-d7b9a480de85	organization:read	View organization details	organization	2026-07-16 17:59:12.045409+05:30
7e57b8c3-e26c-405a-8400-cf14beee4927	organization:update	Update organization settings	organization	2026-07-16 17:59:12.045409+05:30
9c827b98-4731-44a1-ba77-74e2543c7a57	organization:delete	Delete organization	organization	2026-07-16 17:59:12.045409+05:30
817f9721-6bde-4880-beb4-fce699c652f6	user:read	View users	users	2026-07-16 17:59:12.045409+05:30
fe1448e3-4d1f-4562-96c3-2160a2f0d48d	user:create	Create users	users	2026-07-16 17:59:12.045409+05:30
2049bc53-258c-4431-b4a2-76b0a28e246e	user:update	Update users	users	2026-07-16 17:59:12.045409+05:30
f18b7517-232f-4912-96c1-9def6cc60a58	user:delete	Delete users	users	2026-07-16 17:59:12.045409+05:30
84eedcbd-1a11-4d1f-aee0-9e86b697b7e3	user:manage_roles	Manage user roles	users	2026-07-16 17:59:12.045409+05:30
89f6b405-49f2-4550-91fa-9ec9b994bc84	role:read	View roles	roles	2026-07-16 17:59:12.045409+05:30
ad38862b-6f0c-4e57-bfcc-307063433ee4	role:create	Create roles	roles	2026-07-16 17:59:12.045409+05:30
3953a514-a7e5-427d-a0b8-2066fd72f048	role:update	Update roles	roles	2026-07-16 17:59:12.045409+05:30
dec5d165-8d74-45a7-8bc4-a9ec3e4cc101	role:delete	Delete roles	roles	2026-07-16 17:59:12.045409+05:30
a2d02211-8d57-4964-99d2-b2bfa878f301	inventory:read	View inventory	inventory	2026-07-16 17:59:12.045409+05:30
c8b4546d-95d9-4eae-9e9e-136dd3522960	inventory:create	Create inventory items	inventory	2026-07-16 17:59:12.045409+05:30
0d19af57-ab67-4da8-b679-6bc0ff0a31ba	inventory:update	Update inventory items	inventory	2026-07-16 17:59:12.045409+05:30
52cc03d6-7f0f-437a-9576-e65032233999	inventory:delete	Delete inventory items	inventory	2026-07-16 17:59:12.045409+05:30
9b402dad-5e52-4fd5-863c-16205c8dda34	inventory:transfer	Transfer stock between warehouses	inventory	2026-07-16 17:59:12.045409+05:30
5deaa171-26bd-4e0c-8f34-0e9aa9d92663	inventory:adjust	Adjust stock quantities	inventory	2026-07-16 17:59:12.045409+05:30
b1939799-778a-40b0-822a-dd0e4e691c71	warehouse:read	View warehouses	warehouses	2026-07-16 17:59:12.045409+05:30
f3b6d24a-a96a-4f73-a6e2-1742e8afe605	warehouse:create	Create warehouses	warehouses	2026-07-16 17:59:12.045409+05:30
707ee3e2-3c04-4148-af85-4fb6332acf03	warehouse:update	Update warehouses	warehouses	2026-07-16 17:59:12.045409+05:30
c8183959-5ba2-4304-91f4-041e0b1f11d6	warehouse:delete	Delete warehouses	warehouses	2026-07-16 17:59:12.045409+05:30
105c521c-5d97-424e-8349-623582b6ddbe	order:read	View sales orders	orders	2026-07-16 17:59:12.045409+05:30
56d75dc7-b7f9-466d-9f0c-1c8470b20813	order:create	Create sales orders	orders	2026-07-16 17:59:12.045409+05:30
2664e8f2-b749-4164-b716-d7d996635c8e	order:update	Update sales orders	orders	2026-07-16 17:59:12.045409+05:30
270ff6b4-eaef-41d1-a3f8-080a43222d35	order:delete	Delete sales orders	orders	2026-07-16 17:59:12.045409+05:30
4677960d-388a-419c-a958-05ad2aaf61c7	order:approve	Approve sales orders	orders	2026-07-16 17:59:12.045409+05:30
7bb8d119-357b-4fd2-96ea-21cfdffbea48	order:cancel	Cancel sales orders	orders	2026-07-16 17:59:12.045409+05:30
fd9dc121-6d05-46ac-bf2b-b12c4f31c5e2	procurement:read	View purchase orders	procurement	2026-07-16 17:59:12.045409+05:30
dd7ea8c1-f064-46b9-991a-0954dd2a6d73	procurement:create	Create purchase orders	procurement	2026-07-16 17:59:12.045409+05:30
f47586fc-f5df-42c9-ac2e-9eda87be0144	procurement:update	Update purchase orders	procurement	2026-07-16 17:59:12.045409+05:30
649e9b98-84e2-4581-824e-e5c816c0e901	procurement:delete	Delete purchase orders	procurement	2026-07-16 17:59:12.045409+05:30
6e40cd4c-58c1-4861-b345-a839db11548d	procurement:approve	Approve purchase orders	procurement	2026-07-16 17:59:12.045409+05:30
2784b86e-3183-4b4c-969b-99cb9278cd4b	procurement:receive	Receive goods	procurement	2026-07-16 17:59:12.045409+05:30
b42ec108-dcef-40d5-b9d5-84f90a17fddd	customer:read	View customers	customers	2026-07-16 17:59:12.045409+05:30
35b90612-de9f-4ed1-ba00-90712fe2a0f7	customer:create	Create customers	customers	2026-07-16 17:59:12.045409+05:30
27ed8d87-2e17-463d-a0de-9fa992756542	customer:update	Update customers	customers	2026-07-16 17:59:12.045409+05:30
a2c726ef-6e37-433d-8e56-a53957096762	customer:delete	Delete customers	customers	2026-07-16 17:59:12.045409+05:30
ecd53f39-7e2f-4419-882c-10860942fb34	vendor:read	View vendors	vendors	2026-07-16 17:59:12.045409+05:30
e2a7cc31-34ab-4503-b039-558b3f7e86b3	vendor:create	Create vendors	vendors	2026-07-16 17:59:12.045409+05:30
62237854-cb4d-47aa-a315-80de18dd3cd5	vendor:update	Update vendors	vendors	2026-07-16 17:59:12.045409+05:30
8d556036-99f6-4dfe-b30e-a1ff636fbe80	vendor:delete	Delete vendors	vendors	2026-07-16 17:59:12.045409+05:30
9f903b53-6535-4208-83a0-3ee25a208316	finance:read	View finance data	finance	2026-07-16 17:59:12.045409+05:30
4f411795-d2ae-4302-b1ae-75dedac09dee	finance:journal:create	Create journal entries	finance	2026-07-16 17:59:12.045409+05:30
4258489f-fb36-434b-aad2-9f6ab494e434	finance:journal:post	Post journal entries	finance	2026-07-16 17:59:12.045409+05:30
5374bb3f-7013-4da7-9fa9-873f7a8afca8	finance:account:read	View chart of accounts	finance	2026-07-16 17:59:12.045409+05:30
ff85e384-a0a5-4898-b0b5-3c5f1b533a25	finance:account:create	Create accounts	finance	2026-07-16 17:59:12.045409+05:30
8b9595e1-e70f-40f8-872e-df96dfe89d08	finance:account:update	Update accounts	finance	2026-07-16 17:59:12.045409+05:30
9813b1f1-c25d-4929-a67b-ec27e9f3fa9f	finance:report:read	View financial reports	finance	2026-07-16 17:59:12.045409+05:30
964bf94c-62ab-408f-9325-eb3fd289eb14	crm:read	View CRM data	crm	2026-07-16 17:59:12.045409+05:30
f76e3fc4-97e5-4134-ba9a-ad944522bbcb	crm:lead:create	Create leads	crm	2026-07-16 17:59:12.045409+05:30
b66629ac-591a-4808-8845-f413b52ca4f7	crm:lead:update	Update leads	crm	2026-07-16 17:59:12.045409+05:30
5ad20519-1b14-4ea5-b608-1ab0accc7519	crm:opportunity:create	Create opportunities	crm	2026-07-16 17:59:12.045409+05:30
2f20019a-8ecf-4b1b-a56e-a125eaa01f01	crm:opportunity:update	Update opportunities	crm	2026-07-16 17:59:12.045409+05:30
b84979e0-4f4c-4906-a143-c154a04ea8a4	hr:read	View HR data	hr	2026-07-16 17:59:12.045409+05:30
1f82d4fe-07e6-492a-9d72-308a5ea581a2	hr:employee:create	Create employees	hr	2026-07-16 17:59:12.045409+05:30
790dde6a-1860-4c4d-9095-923a66d79d31	hr:employee:update	Update employees	hr	2026-07-16 17:59:12.045409+05:30
654cd029-926a-464b-a6b3-7e13b3165205	hr:payroll:run	Run payroll	hr	2026-07-16 17:59:12.045409+05:30
7c96908c-c10a-411a-a79e-01f4da9c18e1	report:read	View reports	reports	2026-07-16 17:59:12.045409+05:30
92c97eaa-dfcc-4d76-9df4-94c2c03138fc	report:export	Export reports	reports	2026-07-16 17:59:12.045409+05:30
5f6dc0ea-bde6-4599-a6cc-a7718b2ce5f9	settings:read	View settings	settings	2026-07-16 17:59:12.045409+05:30
20b07d81-5578-4001-896a-2f9b5fc95166	settings:update	Update settings	settings	2026-07-16 17:59:12.045409+05:30
1f9a2e34-b480-4f8d-be3d-13a931e08a22	admin:read	View admin panel	admin	2026-07-16 17:59:12.045409+05:30
ba0c55dd-7c39-48df-ad52-633c43ae03e3	admin:user:manage	Manage users (super admin)	admin	2026-07-16 17:59:12.045409+05:30
7e3444a9-2520-4630-9f4d-2562c51c0759	admin:org:manage	Manage organizations (super admin)	admin	2026-07-16 17:59:12.045409+05:30
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.roles (id, organization_id, name, description, is_system, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.user_roles (user_id, role_id, assigned_by, assigned_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.user_sessions (id, user_id, session_id, user_agent, ip_address, expires_at, revoked, created_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict sudEgRShnpWp0LIHzYPyQd2BbRd2DpBkNrTXfc3ciE8FD8Bm0MmhDx3gb16vyiR

