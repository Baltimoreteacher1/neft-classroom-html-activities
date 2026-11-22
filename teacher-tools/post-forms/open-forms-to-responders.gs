/**
 * Open the site's Google Forms to anyone with the link.
 *
 * WHY: every responder link on the site answers "You must sign in to access this content" (HTTP 401) to someone who
 * is not signed in to the school Google account. Each form has "requires sign-in" on, so students on a personal
 * device, and families, are blocked. This script turns that one setting off, per form.
 *
 * WHO RUNS IT: the OWNER of the forms (you), signed in to the school account, from https://script.google.com
 * (New project, paste this file, Save). It touches only the 216 form IDs listed below, never other forms.
 *
 * HOW:
 *   1. First run with DRY_RUN = true (as shipped). Run openForms(), then View > Logs. Nothing is changed.
 *      Read the summary: how many are open already, how many it would open, and which need a decision.
 *   2. Set DRY_RUN = false and run openForms() again. It stops before Apps Script's 6-minute limit and tells you
 *      to run it again; it remembers where it stopped. Run until the log says "ALL DONE".
 *   3. Check from any computer (nothing to sign in to):  node teacher-tools/post-forms/check-forms-open.mjs
 *
 * UNDO: run undoOpenForms() (sets "requires sign-in" back on for the same forms).
 *
 * LIMITS you should know about:
 *   - A form set to "limit to 1 response per person" or "collect verified email addresses" FORCES sign-in no matter
 *     what, because Google cannot know who answered otherwise. This script will not change those on its own: they
 *     are your design choices (one answer per student, or knowing who answered). It lists them as NEEDS DECISION.
 *     Set the flags below to true only if you decide an open form matters more.
 *   - If the school's Google Workspace admin forces "restrict to our organization", Google may refuse or reset the
 *     change. The log shows any form that is still restricted after the change; the fix then belongs to the admin
 *     (Admin console > Apps > Google Workspace > Drive and Docs > Sharing settings).
 *   - Opening a form means anyone who has the link can submit a response. Responses stay private to the owner.
 */
const DRY_RUN = true;
const TURN_OFF_ONE_RESPONSE_LIMIT = false;   // true = allow the same person to answer more than once
const STOP_COLLECTING_VERIFIED_EMAIL = false; // true = stop collecting sign-in-verified emails

// Editor IDs of forms that are not in the list below (for example the mailbox forms). Add them here.
const EXTRA_FORM_IDS = [];

const FORM_IDS = [
  "1Jv7FFSIt1REn655SR_QucTIpIuKujuKtbiT-fUcd1DY",
  "1R-ncd4k75RV65lqGfE-lYLtuKDKzdKsjFiSvkKZMMmY",
  "12Sx64LmUyRcWv4ZqzSDx6wO_DLOR6Tmi7esTWWy__vw",
  "1miCgaQMT5vVGSuDPRNuM56YYiSk-13xE7cqRoswCwzs",
  "10i5FVjiZz_aJdSdquV02f4DsY56ZhmqBv80H8ylvt_I",
  "15yrVZR6lgW6JzeIanEyTRcw3zktSaMVm5LkqaqaBpOk",
  "1kY1MGD9sLtMZYMaoLUguAq6X3LCBsKg6RBygZTIYS_4",
  "1K_mDQ7D2jJLX57ermGVq1YVYN1cZM5cL_VBFYHt_xNo",
  "1wczcCTzwlrv6hcyo16SkPDeJTEbhWY6q0EXfEIavsIY",
  "1OP4UQ6b39PpiaZMhdM8fy0BXKxN13lUZyyWFaDPM7jg",
  "1poWU4zQ1VlVAfgiS0t3V1OzC1L3xKDVUk5oW_xo3OCk",
  "1iZUiTuMD4dBsKLqeWlxZ1TQmnkysmyyqrAYzabBLqzI",
  "1lF4c4O1dBuIbM1lO4A15nGTjWqOzyuPc5bZFU70OIYI",
  "1FjTlI3yvCsEPtTLefY9-tbppbSPwDlfHneNfiVzuEfY",
  "1NrNz_pU6uBFiE3nWvcT6GTm__XelGixpFbA0944ZZKo",
  "1J3h5gcX7Rxz3rJPIL8oqSDeN8IyvW5WrTUBnCxBDz84",
  "1uXftCBWDNjXTlv7dlilL-8YcBKju51ChOXYHnYaCbvU",
  "1bAmq8rjk8zZRQ7C5SEGkOe_8kv4gqqBDTfCTCH3p9W4",
  "18qN4T5ME25-aQve2-5625mRUgigzoQ0E28o4yweP5Z0",
  "1QYClT35r-wFYyaoR3iw-9sMWuq18BYao4FeG256L8sk",
  "1krpKmalIcI94HizRsjQxA0LyuEgKqgvJtYqqAEMtayc",
  "1nrrEaO-WQkWD5cyTSUhqnSZRD0fxphXYTHVYQUVVQWI",
  "1-QpqM9Ym4v-Ocz_y-42EXcWky0f2tcCwdFh70PmhlL8",
  "1EzIZCEeY-9iC1w5SuGjc3lmOgNiGdNWLxp1mByFeLhQ",
  "1cGpHJkFM6YGdCWLjPyXsNzJ_5ApHcsI14qK9cJWaWEk",
  "1GM8saN4B85g3RBQuVUPP2s15qxRNWY9pAVbAiKk6UF0",
  "1_Cy9VEAumCj6lD_baDV-3vQ5rCV2cF81oS9doZylaBI",
  "109ZDOdGNbMGddwHueSOzJEzlXD0w7-NWscjwIyu2zfI",
  "1WpL1CdUzE8g4eyJRcPMe4m-Sdc346-GnMCvq8TUyfxI",
  "1Csx0ONtiaVtKM1vr30NpDt3bC-CicvMRDg5IWab0SlQ",
  "1aCcqUZOM6A3TZVwVHY3iQ8U6LJewlSNpzkKosQd99eo",
  "1HwLWpBtYYNqYBSB2iQS7ftOo0zv6U9390AoZQk5NB_U",
  "1Hzbi4D3Yb9N5oxvuA83maU5w48oaeX3Y6H6jleMESCM",
  "18R13E_JN520wEfBXU6NsYnO4_cJaZEibuCIxxGJrdJ4",
  "1Ow9gCRQbM1CBkaRAw5hyQ4HW_8Rx97Y1jG4eZiSBrs0",
  "1-CojxhBQIOA4No3nZJJumXXPZSEkN80NdRWHb0CoQL0",
  "1emMy4AgN_UdmlGHQr1qAWGm10v-jWsPPup26yVmK7CI",
  "1_cdMcKhOp673YbLh7xM8rmBZa-MOH6RbLesXN1yYuIw",
  "15hCp3cNhCM9NA8qa9NXP41YJc8Vk3ZcxPZfb5pHJaFw",
  "1B2U7XB39AH9eyCyNsHqAY9V8KSVLOKCCOazGLfGMd2U",
  "13pltpoJp7zZ1pdu6QjVkZOr_6PCLWUEzi7vEqXsLf5o",
  "1eUeaZL7kZklNkWqgEuC8OKj8nOXSPhrvtLjh9SEoOoQ",
  "1MaTNH4Ri2pQ1ZXm_QON5tjEApcJACXl0Vi3Eb1jeKfc",
  "1EsfE-mILu6MyEIlqUKiKLlqMoICFqoD8xSrdp6IJtvE",
  "16R7f1cwVbN1RnG4LBoZhkfgG-O3X42FD7e3qJtsCHI8",
  "13ehIfxyfMLriPsRc-HK1lDoQ36D1be4atrIfIY8nIEM",
  "1WNHzZ4NZVOWa8otOKjCdQylnjC_oMakFEgfv5WtjSIY",
  "1RXE08cW_uSP3Hkrd4IjE916QOMJio_-AQt8gQIjV4N0",
  "1t-w_8HhwxkauAAewQyb19p9SYCw6uiHfHEpTRR4qV5Y",
  "1utC4WGjBVVSGYHdiEC4FjFzm4kpLBy4MKjFi1bZLZus",
  "13E0nCAPl8PjgskzdyK4H1QUK1yMPAVScFegAB83c9Lg",
  "1kz93cAuF_Eh6loFwASKjHhAV347RdDGosOCVD5KM4iY",
  "13xGoi30f4f0VEaEm5h83SKWBINmZZaSEeOfYrOpe1N0",
  "1OPqHL0vlujsrF6jq2zBSH8azIpM_qvlJ5hPouqG6mPo",
  "1CCcWg7KFAWyFLE_EoAebHaC6CPHsBLfE8dH8XKzR1vs",
  "1uWBJqHNRFl2mpZQ8cwiSU2G8OdCK0J97DUhv6HrdzAQ",
  "1QGfD22exiHfEmVzkYKiwc7k3HNzeoeVu8Tm3N4UVUbA",
  "1aPIntK1frFTQAUq2ei2a50JlFvII08sqDXkJxXtNIsI",
  "1_F6D7n-WScyUMMFXOZSPwJujQL3SGZCCtZQ2msKLswY",
  "1KYw9Ui2EXjA3F9-ceh6d_Af73OepnR4VnIYVmtyieZA",
  "1ch9LpulOizFnJHCDmsbnf-H5O368xgjFqAdo81eBals",
  "1hM7xZB_QI-36ANFaTjSU1HsSn4w69sXAevmG8ZRd330",
  "1cQCthyRcv2pulpTaHIDrOcAVmQmWlQi63i-znBv78aM",
  "1kJiOsH4b4GhyJRUI4-SkVK7Rhz4PaK9p4kVDATmNkw4",
  "1AAkgXmwSmz8hSaCWDoZmoTYy_P6kN2ghL4qAhGT-qiQ",
  "1pPlJAUP08KfO7WoTyXRe_QcshbpiRXsTfdDj2Tfff48",
  "1G2jnyN6KTRqw-kOM2-h6Qfd3QfLtU2xpfOghtO4b0W4",
  "1m8aeXz6mdwBoXTyD1bi8IXwX1_FUrw3NT1pu77kIk-c",
  "1I5Hu_HVoiR-qQYZeiBHdKVf01Bm6H-MpkUo3utntrmo",
  "1_EQuFmJnazA6g7HUxcAMowc2MkasoG_yvmqinB826Dw",
  "1RhBRG4EX4l-Ybix40kwfLdZQ7hJV-SsOyi4hfhb2vmk",
  "17SoIUEIFMMgRwbGwBOO69t855tlyeIk44EE-v0yzqSk",
  "11kYRwZU3mlSkzQ2-qd7Q_iEvBFRVBZ1vGMWl3tlnk48",
  "1bLYQYXNTNHkFD06eshkNdZ0ZHekWxBNUTB3KSKHnllE",
  "1jVgHFXQO4QRuBG65j9PujJzCZvt5YLD9MI0hAwhbi2U",
  "1Pd3STWTP-LGaxQBlTGjKFf8WenA2ePGBGh9hvEkAnfM",
  "1jtacX6Qg_F34v7Yk8dG0wfmP4p5VKnxXoyyD3mQWdW4",
  "16_8KhhNSTSsVbMCxLoZn642Nmq5Gdon4ZfBsQKUd39w",
  "1SvGChKECusWVcRyrGFdp_Uek57xnDOii89bxfCUqVJ4",
  "1padaHfdQ9UhqJFXq-Gh-omNNyZAVY18Xhqwfx40vA98",
  "1WLEeUTnVBVG5GvtPwNkATfy3uKy0NiTg9bTvc6deNUQ",
  "1Cm_iOjTISLEHbv5EVyIoa5ZBNu0eH5zfq-YWrCUvZyw",
  "1koG1xCubBF6sE4qKzvZRACKBZxv04uCC71nD-UvGvFo",
  "1XzXEK1V3xNFP5KUze9i8n0fVN5cIqPRrXMErNVRhnVk",
  "1AMVBkuPKk-g_EIAz8Ujo1vVXzWeuJgL2zqJIeBEEh5s",
  "1TacsVRpXFJZsyItt3O3AgOqX5zEGESl0HqKiYhk_CoM",
  "1t7L2vBLFVS-e26YrJ279mcGhmhKBPfN6vGQaMKo9tcc",
  "1iEEejNC23VfkclpujLLx26Ga1oQdp1kfpHm9S7qy7AU",
  "1my2UE2EZlcPOyFn6E24d7MJsxqVEx1rraj6IoueG4eI",
  "1i5jIc9l2IkHPHwtk9TkjTCcNlUNwEVpDtFIwEto7hZs",
  "1xYoMKPNm5oXCJjpIO16ma-Sk3-RIapWZhs3GXB04rI0",
  "12g1m1ORvnNmpo5oHdTJnNOXABC7VLHu3M_5gT4DhAZA",
  "16FMTLnvAwSBt3o0izXiCVIfaf7hpztW0BQArA03YukQ",
  "1Wa-HaPJiPYNH_t-cukg8BoOJg0l8v65oI_57VWntn8k",
  "1cEFEiAZTSan0VlTJTSZSYuJRYv4wBNhVx5l9lq6Zs8o",
  "1YWSEN1UMbPGnQKcDBPAnLv7TcFwcXN6ymH11g1ojyZk",
  "1WnCEkI3QSwMUuN9F9yQRCOZ-zz7ppTUcpHC-_j-RW2c",
  "14PaknTpulVz4tc9bm1vFK-RZe0hhUjIypJt6AtEz3wA",
  "1tAVRfgTDlqWX38NK8JNjwESiK1kVymFKu8y07ewUWbQ",
  "1i2IyLXVI0JRZEXCzxfth2qJ3BZq6vr-gPCeczQORC2g",
  "1VhFS-6nyZhwnI8bq9_5h1MqBTp_d_WQFxfYGKEwAZaE",
  "1asBTLwGU29d6MMfnxcU6Cm9HcXDuFwGKKKCA3NaAy00",
  "1nc27CYwI4X5gzlnOp-Bpk6dROq6_Zl9wWz9KuKNvWKE",
  "14AYv26UUn-lvBgReMhsd3yJOgXaUynixfFTYnT-sL4Y",
  "1_uYb_rOQZzvkj51eyybALEO_3hYb_PVSc1azvx-fDKY",
  "1rK2rveHJgN2Sn6tt_MTcN0notnG5zL2adpavMKW4mzY",
  "1-z6Va6D9csTcURybnh6QjvhrEfPpzLL12qzQNwM1gC8",
  "1ZQT0m34FdG7JdCAIwKEUvte9uE2sAzmtfjxEc_UF5-8",
  "1iDsJBiWq_yXY2pXrwqG8WRKfImTCqK8j4A6p4Ziu4BA",
  "1HL_HPjGK55MPHqKovL8jP5ui-g679KGY3nYWKIYrZhI",
  "1EKX-j_16AGADS9E9VBF9nwt3DU5MlNVEb57rUrm8KIY",
  "1uV6QLMzwX7fhQCeC-p4QS6aL4SieokTqvKUG1WjIi-A",
  "19fscUIDHC9rz-fjw0qpYK8aHyuCaK-_gvh-oBc_DE9Y",
  "1LmIk7Kj-R6TslRr0HqVCDJE0Cq-EH6d08LAo1I_0bHg",
  "1BzUBfOWNfwJtkZK1bjH1BCOA03mFeptubtpbyHrtZd8",
  "1zi5kHc0aM7iFO_AU5sEzn74gm4_fQ50yVRjjI93Gris",
  "13RklmFEXi0Xkcytys4WxPLAYagmlI5k-SIuf-dDa3Dc",
  "1zloLybLEMFTBrwu6lrjLNwiffRgaLQZHgP7ZHrCIg_Q",
  "1oUhKTCRGFcCKey1gBGkZw0N9MsjuaXvmaRP4J35lTa8",
  "1dXJ_mAadQVA4X6rkrORGG4-He4tf2jSwQiuv5TND2xo",
  "1WmhaAYjE_BYctrefvDBElBjVB2fTGKZ6lDJ2heLoor0",
  "1fbdONpLmYldskZW-vIJ0ropmKppg9EsbuS850RS7fDg",
  "1KTtGjFJlojcdbxMepQFJuNhkCHe2vFP2yH5BjFqQm8w",
  "1QTstuDDIb6d9BhZCOBeuRJiD-u17NGwwTAU1-Ji04uM",
  "1-c5exWy4daZplYZVDUX4SdQSkYOgvn5bo5grylFdzec",
  "15tei-pcPu8nTXPLC9YW5IhaNEtUAd7prMBk0IHerxz0",
  "1muahh84-DdgoND1uaiRVuynGPTCSju-SsC5ycTCwwYc",
  "1BrhKcBGlxJlMgvo4wOThZG4RIDrulxGVLy4D919z6Go",
  "1nO5PgQZvngh8JbbjDe2gVQ8Pf1HispZ2klHvOq9msLA",
  "1ti2oKkKL1JjE25fHex1rCKSUvuQD9CkY0mPLj9unUS0",
  "1lOKXCgSNQ65lxBXCTiXgrNhJu3npnn3KJFQ5DFmr3pA",
  "1lScu1fOyZBrd1juhFjfA-A36OaCEPiLCkE8fGilF_84",
  "12umeIMuPYEMcsiUd1V7qKEkmmqFToT2ubg0Yv06qzZ0",
  "1IOeIfdsttPqaiiSJ6wdIFNYPTJVD1PJR-fh2d14foYw",
  "1ZKg2e7H4CcCRRdgxEx8bHNFTTxLzBCzCWdCfmSO5jaY",
  "1ESIuBmmd6vOJxNgNllcPGjU7btOVdgqN9MpNSkKOFmo",
  "1EOENLabkUFaXiE202yvrMG-wOJJTqwOFqy3qG3iM5oI",
  "1Otov4L_fMsJbWiRoG3ljxfhJboPwXoEtvTjSD57_Gkg",
  "1y8Uw04NK3Wf9456Y_VKudgC_2rm7J_6gTPj2mLqrs5I",
  "1SCwBpDEKeXuFsqDXTVpKNQfsyStYkuNZlWvMs6QLEzQ",
  "1o3Pq4Q56J5l_lq_1QUlnIazJ4eo69osylhTzdwqSdI4",
  "1y46hTPVK0bfcLM1aJhkRLZJpYNuBf4OwL_W7hPo_4GI",
  "1okxsgu1A1NHm77PDRP_chvo8IcqS7EBW35h_3kQsujw",
  "1g3f6lB_mhkC7nqU3jv2dYZ634-xNDY0RmSEi4_ZsjCQ",
  "1Kd0d7HzcWvGvBZ5gj4f-7tA1Obc-Dy_Igq9VzHqR1qI",
  "1NJTE8ti2PnWOR1UwQfqF9go0MGWieR50F2QNivMUfQ0",
  "19VM4t3NHORAjJy9-SlxQe8gyz5cWblDty7h7yj7LHS8",
  "1QR24wAk0j_249do0qqMqVXBlYpqhUIPvX100vdQj15U",
  "1Fe696VfGPY-a9IuofVcBEQgul-nr-6z0knzFXP33CR8",
  "1ban7X2usSOWywCGQtrYtqrcepftaSVVl5gVKXwE2HFk",
  "12g-BwIE4lVA6DxlsKj4MeJ39yQVlncYS54Jvl6usEyo",
  "1AburPl52QNXSHjafLCNIgOaQQTtL_7Om51LFXRJpCsI",
  "1G9qUEumXPDSvyB1ojcQFam8qPyZQnNHewLw19p9jcl0",
  "1XhcvPhZCT0QGZw1QN4t0bC7AUyZHqndhG-3SghH-YmQ",
  "1rkLX2b8B6wEei7KLd092tfn7s_-QAP98ELCKEQb81As",
  "1FDw7Y5x_SbNRe3Q-XyIbiMppcnWn70MxClAyMfiFMuA",
  "1EASFj6umrRzX9L4_U0l6Ip3ZaIlhIaNKqfp3baUuziE",
  "13pvojEffytzSYVmSxWORJaXffiiq2HhEnIBr4KZPguM",
  "1xKJIHyU7jGVqEqslyLyn0zql5xgE4EbAC9dBDDQz59k",
  "1TuHjsW51ao2wKnxOR3Af-SorDovGOfpbIGcQ7sITxqk",
  "1-eVWNY8s-Keo1GTtNZwwHugF2L6Nl7i5d3W_oltqjDM",
  "11clTqwP5UN51Gaa4TEh3wsAHuoT1dgf4z89PW4kXBK4",
  "1w9riOqIzXfSOGZbCQwb-bsYnaj-AppKwpIOvqU931jY",
  "1QW-BrwSHJZmiQjihvJWbTtHT7cukmvKg9Y6RCD--5tY",
  "1HzXUk-eG1Urr44yW3Il6kowyNPZc02Lz7Fqn1hRPB3Q",
  "1ZT2qWZ5bqGghv-1d8FEoBgVfrUvrttcbF_thGpuqzIs",
  "1wCWxFN0_XaKA1fz-uPUCKOfipT4YQhvNHTX3SFX86bU",
  "1GUbcjct2_vRyyixEY9oETr7Hs8J3yig4eVAXlsnx46A",
  "1x7OPHttIe0XresFFBORnEvtRJCo1YU8LdyQfadPuw8o",
  "19svqkH3-9iG_9Cl-vOn90rfyPN0GVp2zaT1e9jEgXms",
  "1uG9E09qlOrMFj1MaFam_x7Jb8XOUyydmCeylJXAsViM",
  "1yg6IBzw3PQxFOmq-GmKPizRJDSxNMATDgmWS0e-myI4",
  "1XzhMBsDG4G4-qYDTy5s0ceP6sGn10B_75_4iwddXuII",
  "1cRwyxTX5pb2159vhDsCQ4CuOH2mWOkwprsGD3oJUkME",
  "16_ukqNKsC1_FR1XfJkYNcsyHdYxhNHsAzowJf8BZ70o",
  "13HU5JW9bE02xyzhG3LkrOlkNxyXqbcnhiLVhgoi9NaY",
  "1yxxwKhX3hb4-8Tdf_xi9wKVOPW1jiHakOiqp9dhe_KA",
  "1FRLxWOU_sAZ78FPqqlVDb_icAb95dPpaPlD1owgQBNs",
  "1n1RE5W9oVJssRGmRv7i3p7pPjVnegQl7kw6FVdA4aiA",
  "1ZunouokPgvo-qE4oiiP6EEDE2-LtqIsLtZZOnb-KMFM",
  "1Ck8QlCtBnnN1OcQJVFzF_6bjCnBGa3UPvFKpQqxCtWA",
  "14HOtV5LaDd3V0knJV4tKmMr8aMEWwnAoCgWvFD9_0NI",
  "1b1B70EfQVU6AXZ2mHFHO_YzK8xEBVmE0OiTopxrvGWQ",
  "1Wgz00lo4XQ1d7EWst19oKyFvM5Ge5_WKK8sB00CTG1U",
  "1z-K8c55ZbVWwhh9DCOSK204uqFZf8CGITdeG8NqE4yM",
  "1EJY5Dkc1irOuhgXVYULZ02KZtX368qEy1sOOHPkDq38",
  "1qp-us9_qYqxlDF6XxuL3aIZ0V_s0TzEG3emmEs_fucg",
  "1Lgad8G_bIOeEFyDfeIE1USjti_m0-s7cUM1fYwKG8qo",
  "1v67v_NcMynplVYTtNKJZkzbl0ppLn4ilnL2QRa7XwO0",
  "1uIiE3wDzcQPLMRRNLhejVLfu0YJGbQjWeHSC2ZhweU4",
  "18uP7C0mkSYdKuIOvYzfgJ74TKBbsMryfLh2vON6Zn-8",
  "1G0HTo0-yjECbQM8au3SnSaNbM1GS_HfCqYSXVT2iMLE",
  "1FCoeaWYLqBeq3JHXmtGzmzXGt6A0nr1BK5zvgbD_dWA",
  "1ozVOBLGaUJEvD35pKzG0acRIy496a1gOx7jviv7N7NI",
  "1k63Rl13am2rdVF48LN_ci1Kf4bRYLB9WbBLT1gNrbxc",
  "1hfflHN9naIRaG-3MGAD7DXxPbiTdB9UwydFIODj7Pxk",
  "1Lc2Dp6U-oI_0DQHE__VHF0bmTReA4rcoadXM7QP_C3k",
  "1Ffzg-gugdXD8zAdvgqSO-SgPq_l0Cqzeg3YUV54kw0U",
  "1oxaDUCIblXenF1YknHYMI7DgTuJmYI06sSND42dsV44",
  "1Rlw3ixR6gyv0RAWLe_poQ3s3HngAWTQe7zB7FSusD-o",
  "1--A3T7ByBV-tfQzshCQ34j1otCFQFXuS4w8c6uLQg0A",
  "1ziuRZIqJXOjB4mqL68nEfRS-maWfdcVk-7RqBrx_0_0",
  "1w2FkG6jLrMTFg5Wqbx32fH0noxEN0oilaOLyrnJzghM",
  "1a_eviHo8br6N1yGkasTzH4DTJK2Ss5bopihos9qFOaw",
  "1GFtPkkC39Ljw14IMDtbYEkYl6JO1bfW_GF9T5QUvRac",
  "1GXVOpM7lkV4TuC1copJJY-CaClfh3-oW_PzsHN0bqLM",
  "1E2r_nlOPFOSpylU9Lb7EgK56GwSgCd-vdAvG1o7JEWY",
  "1rqkfqdy0zl1mq5d3esJ7bgKHZccp4XGgRZ38uQX3aYk",
  "1dn13_oqayzQB_SZfqDX1dqOi3AMdNNAGTjvIcrrxJTo",
  "1QXSPIfMDc9nDMSqqWo-05GmJ9fxKnGKsHm1RgB8Jlhk",
  "1H1XQJtGKbiYp_JdEVNgYFGD0gvQ68BvRl6hQBye7MGA",
  "1x0IhbPzh_KPz9dfBRJ-wtsa3xLeS4lOcHQ9cPdi3Tqw",
  "18SeUTk7wLZ7DRyJ0cCsODYwv_d2HpNnPdxquYDZDdKc",
  "1xR5Mr5dx-gr3AqAqkNX6E72x4FG0zYxjXArlS7UgW1s",
  "11CGR4lRR5842AnebgLEUgnfLea7_UsvHd2ebXG9lEus",
  "1KVoQDP0FRwJ1QyPN0X9kE-Slr_nbH_thmVmhknDhFms"
];

const BUDGET_MS = 4.5 * 60 * 1000;

function allIds_() {
  return Array.from(new Set(FORM_IDS.concat(EXTRA_FORM_IDS)));
}

function stateOf_(form) {
  return {
    requiresLogin: form.requiresLogin(),
    limitOne: form.hasLimitOneResponsePerUser(),
    collectsEmail: form.collectsEmail(),
    accepting: form.isAcceptingResponses(),
  };
}

function openForms() {
  const props = PropertiesService.getScriptProperties();
  const mode = DRY_RUN ? 'dry' : 'apply';
  if (props.getProperty('mode') !== mode) { props.setProperty('mode', mode); props.setProperty('next', '0'); props.deleteProperty('tally'); }
  const ids = allIds_();
  const tally = JSON.parse(props.getProperty('tally') || '{"open":0,"opened":0,"wouldOpen":0,"decision":0,"still":0,"error":0}');
  const started = Date.now();
  let i = Number(props.getProperty('next') || '0');
  for (; i < ids.length; i++) {
    if (Date.now() - started > BUDGET_MS) break;
    const id = ids[i];
    try {
      const form = FormApp.openById(id);
      const before = stateOf_(form);
      const blockers = [];
      if (before.limitOne && !TURN_OFF_ONE_RESPONSE_LIMIT) blockers.push('limited to one response per person');
      if (before.collectsEmail && !STOP_COLLECTING_VERIFIED_EMAIL) blockers.push('collects verified emails');
      let label;
      if (!before.requiresLogin && !before.limitOne && !before.collectsEmail) {
        tally.open++; label = 'ALREADY OPEN';
      } else if (blockers.length) {
        tally.decision++; label = 'NEEDS DECISION (' + blockers.join('; ') + ')';
      } else if (DRY_RUN) {
        tally.wouldOpen++; label = 'WOULD OPEN';
      } else {
        if (before.requiresLogin) form.setRequireLogin(false);
        if (before.limitOne && TURN_OFF_ONE_RESPONSE_LIMIT) form.setLimitOneResponsePerUser(false);
        if (before.collectsEmail && STOP_COLLECTING_VERIFIED_EMAIL) form.setCollectEmail(false);
        const after = stateOf_(form);
        if (after.requiresLogin || after.limitOne || after.collectsEmail) { tally.still++; label = 'STILL RESTRICTED after change (ask the Workspace admin)'; }
        else { tally.opened++; label = 'OPENED'; }
      }
      if (!before.accepting) label += ' [note: form is not accepting responses]';
      Logger.log((i + 1) + '/' + ids.length + ' ' + label + ' | ' + form.getTitle() + ' | ' + id);
    } catch (e) {
      tally.error++;
      Logger.log((i + 1) + '/' + ids.length + ' ERROR ' + e.message + ' | ' + id);
    }
  }
  props.setProperty('next', String(i));
  props.setProperty('tally', JSON.stringify(tally));
  Logger.log('--- ' + (DRY_RUN ? 'DRY RUN (nothing changed)' : 'APPLIED') + ' | processed ' + i + ' of ' + ids.length + ' | ' + JSON.stringify(tally));
  Logger.log(i >= ids.length ? 'ALL DONE. Now run: node teacher-tools/post-forms/check-forms-open.mjs' : 'Not finished: run openForms() again to continue.');
}

function undoOpenForms() {
  const ids = allIds_();
  let n = 0;
  for (const id of ids) {
    try { FormApp.openById(id).setRequireLogin(true); n++; } catch (e) { Logger.log('ERROR ' + e.message + ' | ' + id); }
  }
  Logger.log('Set "requires sign-in" back on for ' + n + ' of ' + ids.length + ' forms.');
}

function resetProgress() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('Progress cleared. openForms() will start from the first form.');
}
