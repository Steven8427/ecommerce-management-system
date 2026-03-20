CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL DEFAULT '' COMMENT '用户名',
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT '密码',
  `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '昵称',
  `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT '角色',
  `permissions` text COMMENT '权限JSON',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1启用 0禁用',
  `token` varchar(64) NOT NULL DEFAULT '' COMMENT '登录token',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
