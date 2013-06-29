<?php

/**
 * @file getdirections_box.tpl.php
 * Template file for colorbox implementation
 */

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN"
  "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?php print $language->language; ?>" version="XHTML+RDFa 1.0" dir="<?php print $language->dir; ?>"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/terms/"
  xmlns:foaf="http://xmlns.com/foaf/0.1/"
  xmlns:og="http://ogp.me/ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:sioc="http://rdfs.org/sioc/ns#"
  xmlns:sioct="http://rdfs.org/sioc/types#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema#">

<head profile="http://www.w3.org/1999/xhtml/vocab">
<!-- getdirections_box -->
<head>
  <title><?php print $head_title; ?></title>
  <?php print $head; ?>
  <?php print $styles; ?>
  <?php print $scripts; ?>
<style>
  body {
    width: 800px;
  }
  #page {
    min-width: 800px;
    width: 800px;
  }
</style>
</head>
<body class="<?php print $body_classes; ?>">
  <div id="page-wrapper"><div id="page">
    <div id="main-wrapper" class="clearfix"><div id="main" class="clearfix">
      <div id="content" class="column"><div class="section">
        <?php if ($title): ?>
          <h2 class="title"><?php print $title; ?></h2>
        <?php endif; ?>
        <div class="content">
          <?php print $content; ?>
        </div>
      </div></div>
    </div></div>
  </div></div>
  <?php print $closure; ?>
</body>
</html>
