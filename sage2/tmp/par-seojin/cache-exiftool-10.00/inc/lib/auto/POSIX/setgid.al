#line 1 "auto/POSIX/setgid.al"
# NOTE: Derived from ..\..\lib\POSIX.pm.
# Changes made here will be lost when autosplit is run again.
# See AutoSplit.pm.
package POSIX;

#line 737 "..\..\lib\POSIX.pm (autosplit into ..\..\lib\auto\POSIX\setgid.al)"
sub setgid {
    usage "setgid(gid)" if @_ != 1;
    $( = $_[0];
}

# end of POSIX::setgid
1;
