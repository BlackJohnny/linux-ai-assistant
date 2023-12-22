# SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
# SPDX-License-Identifier: MIT

SHELL := /bin/bash

NAME     := linux-ai-assistant
DOMAIN   := blackjohnny-gmail.com
ZIP_NAME := $(NAME)@$(DOMAIN).zip

# Some of the recipes below depend on some of these files.
JS_FILES       = $(wildcard src/*.js src/*/*.js extension.js)
UI_FILES       = $(shell find resources -type f -and \( -name "*.ui" \))
RESOURCE_FILES = $(shell find resources -mindepth 2 -type f)
LOCALES_PO     = $(wildcard po/*.po)
LOCALES_MO     = $(patsubst po/%.po,locale/%/LC_MESSAGES/$(NAME).mo,$(LOCALES_PO))

# These files will be included in the extension zip file.
ZIP_CONTENT = $(JS_FILES) $(LOCALES_MO) resources/$(NAME).gresource \
              schemas/org.gnome.shell.extensions.$(NAME).gschema.xml \
              metadata.json LICENSE


# These seven recipes can be invoked by the user.
.PHONY: dist zip install uninstall pot clean test references

dist: $(ZIP_CONTENT)
	@echo "Generating dist folder '$(NAME)@$(DOMAIN)'"
	@mkdir -p dist/$(NAME)@$(DOMAIN)
	@echo "Compiling schemas..."
	@glib-compile-schemas schemas/
	@echo "Copy everything to dist ..."
	@cp --parents -u $(ZIP_CONTENT) schemas/gschemas.compiled dist/$(NAME)@$(DOMAIN)
	@echo "done"

# The zip recipes only bundles the extension without installing it.
zip: $(ZIP_NAME)

# The install recipes creates the extension zip and installs it.
install: $(ZIP_NAME)
	gnome-extensions install "$(ZIP_NAME)" --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'r')."

# This uninstalls the previously installed extension.
uninstall:
	gnome-extensions uninstall "$(NAME)@$(DOMAIN)"

# Use gettext to generate a translation template file.
pot: $(JS_FILES) $(UI_FILES)
	@echo "Generating '$(NAME).pot'..."
	@xgettext --from-code=UTF-8 \
	          --add-comments=Translators \
	          --copyright-holder="Ionut Negru" \
	          --package-name="$(NAME)" \
	          --output=po/$(NAME).pot \
	          $(JS_FILES) $(UI_FILES)

# Regression tests
test:


# This re-generates all reference images required by the tests.
references:
	@ for version in 39 ; do \
	  for session in "gnome-xsession" "gnome-wayland-nested" ; do \
	    echo ; \
	    echo "Generating References for Fedora $$version ($$session)." ; \
	    echo ; \
	    ./tests/generate-references.sh -s $$session -v $$version ; \
	  done \
	done

# This removes all temporary files created with the other recipes.
clean:
	rm -rf $(ZIP_NAME) \
	       resources/$(NAME).gresource \
	       resources/$(NAME).gresource.xml \
	       schemas/gschemas.compiled \
	       locale \
				 dist/

# This bundles the extension and checks whether it is small enough to be uploaded to
# extensions.gnome.org. We do not use "gnome-extensions pack" for this, as this is not
# readily available on the GitHub runners.
$(ZIP_NAME): $(ZIP_CONTENT)
	@echo "Packing zip file..."
	@rm --force $(ZIP_NAME)
	@zip $(ZIP_NAME) -- $(ZIP_CONTENT)

	@#Check if the zip size is too big to be uploaded
	@SIZE=$$(unzip -Zt $(ZIP_NAME) | awk '{print $$3}') ; \
	 if [[ $$SIZE -gt 5242880 ]]; then \
	    echo "ERROR! The extension is too big to be uploaded to" \
	         "the extensions website, keep it smaller than 5 MB!"; \
	    exit 1; \
	 fi

# Compiles the gresource file from the gresources.xml.
resources/$(NAME).gresource: resources/$(NAME).gresource.xml
	@echo "Compiling resources..."
	@glib-compile-resources --sourcedir="resources" --generate resources/$(NAME).gresource.xml

# Generates the gresources.xml based on all files in the resources subdirectory.
resources/$(NAME).gresource.xml: $(RESOURCE_FILES)
	@echo "Creating resources xml..."
	@FILES=$$(find "resources" -mindepth 2 -type f -printf "%P\n" | xargs -i echo "<file>{}</file>") ; \
	 echo "<?xml version='1.0' encoding='UTF-8'?><gresources><gresource> $$FILES </gresource></gresources>" \
	     > resources/$(NAME).gresource.xml

# Compiles all *.po files to *.mo files.
locale/%/LC_MESSAGES/$(NAME).mo: po/%.po
	@echo "Compiling $@"
	@mkdir -p locale/$*/LC_MESSAGES
	@msgfmt -c -o $@ $<
