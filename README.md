Adopted Zimlets and developments
================================

Introduction
------------

This repository holds zimlets, that were adopted by developers by seemingly or actual orphaned zimlets.

If you have other zimlets, that you've updated but can't reach the author so he/she could update the gallery, please
send a pull request to have them included here.

The zimlets available here mostly are more compatible with current Zimbra versions and have bugs fixed and 
new features added.

Currently available
-------------------

 * Archive zimlet [ca_uoguelph_ccs_archive](https://github.com/Zimbra-Community/adopted/tree/master/ca_uoguelph_ccs_archive). ([Original zimlet by ccs.uoguelph](http://gallery.zimbra.com/type/zimlet/archive))
 * Colored Emails Plus [ca_uoguelph_ccs_coloredemailsplus](https://github.com/Zimbra-Community/adopted/tree/master/ca_uoguelph_ccs_coloredemailsplus). ([Original zimlet ccs.uoguelph](http://gallery.zimbra.com/type/zimlet/coloured-emails-plus))
 * Sidebar zimlet [ca_uoguelph_ccs_sidebar](https://github.com/Zimbra-Community/adopted/tree/master/ca_uoguelph_ccs_sidebar). ([Original zimlet by ccs.uoguelph](http://gallery.zimbra.com/type/zimlet/news-and-events-sidebar))
 * Email-Templates zimlet [com_zimbra_emailtemplates](https://github.com/Zimbra-Community/adopted/tree/master/com_zimbra_emailtemplates). ([Original zimlet by rrao](http://gallery.zimbra.com/type/zimlet/email-templates))
 * Linkedin zimlet [com_zimbra_linkedin](https://github.com/Zimbra-Community/adopted/tree/master/com_zimbra_linkedin). ([Original zimlet by jiankuan](http://gallery.zimbra.com/type/zimlet/linkedin-zimlet))
 * Sticky Notes [com_zimbra_stickynotes](https://github.com/Zimbra-Community/adopted/tree/master/com_zimbra_stickynotes). ([Original zimlet by rrao](http://gallery.zimbra.com/type/zimlet/sticky-notes))

Using the zimlets
-----------------

To use the zimlets, you'll have to package them yourself. If you're on a Unix-ish system, you can simply use
the makedist.sh script to generate zip-files for distribution.

If not:

Create a zip-file with the same name as the zimlet containing **only** the files in the subdirectory of it,
**not** the directory itself.

For example if you want to use the archive zimlet, create a zip-file "ca_uoguelph_ccs_archive.zip" containing
all files **within** the ca_uoguelph_ccs_archive.zip-subdirectory.
