"use client";

import React from "react";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";
import Editable from "./Editable";
import { stringValues } from "@/lib/live-edit/helpers";

type Props = {
  section: string;
  subtitleKey: string;
  titleKey: string;
  descKey?: string;
};

export default function EditableSectionHeading({
  section,
  subtitleKey,
  titleKey,
  descKey,
}: Props) {
  const t = useT();
  const { strings } = useLanguage();

  return (
    <div className="section-title-wrap">
      <Editable
        id={`${section}.subtitle`}
        label={`${section} — sottotitolo`}
        kind="string"
        stringKey={subtitleKey}
        section={section}
        values={stringValues(strings, subtitleKey)}
      >
        <span className="section-subtitle">{t(subtitleKey)}</span>
      </Editable>
      <Editable
        id={`${section}.title`}
        label={`${section} — titolo`}
        kind="string"
        stringKey={titleKey}
        section={section}
        values={stringValues(strings, titleKey)}
        as="block"
      >
        <h2 className="section-title">{t(titleKey)}</h2>
      </Editable>
      {descKey && (
        <Editable
          id={`${section}.desc`}
          label={`${section} — descrizione`}
          kind="string"
          stringKey={descKey}
          section={section}
          values={stringValues(strings, descKey)}
          as="block"
        >
          <p className="section-desc">{t(descKey)}</p>
        </Editable>
      )}
    </div>
  );
}
